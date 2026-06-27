import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLFieldConfigMap,
  GraphQLInputFieldConfigMap,
  GraphQLOutputType,
  GraphQLInputType,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLFieldResolver,
  GraphQLEnumType,
} from "graphql";
import { getMetadataStorage } from "../metadata/storage";
import { type ResolverMetadata, type FieldMetadata, type ParamMetadata, type SubscriptionMetadata } from "../metadata/types";

interface ObjectTypeInfo {
  target: Function;
  type: GraphQLObjectType;
}

interface InputTypeInfo {
  target: Function;
  type: GraphQLInputObjectType;
}

export type AuthCheckerFn = (context: any, roles?: string[]) => boolean | Promise<boolean>;

export interface SchemaOptions {
  resolvers: Function[];
  authChecker?: AuthCheckerFn;
  validate?: boolean | "auto";  // true = always validate, "auto" = validate if class-validator installed
}

export class SchemaGenerator {
  private static objectTypesMap = new Map<Function, GraphQLObjectType>();
  private static inputTypesMap = new Map<Function, GraphQLInputObjectType>();
  private static enumTypesMap = new Map<object, GraphQLEnumType>();
  private static options: SchemaOptions;

  static generate(options: SchemaOptions): GraphQLSchema {
    // Store options for later use in resolvers
    this.options = options;

    const storage = getMetadataStorage();

    // Build all enum types first
    for (const enumMetadata of storage.enums) {
      this.buildEnumType(enumMetadata.enumObj, enumMetadata.name, enumMetadata.description, enumMetadata.valuesConfig);
    }

    // Build all object types
    for (const objectMetadata of storage.objectTypes) {
      this.getObjectType(objectMetadata.target);
    }

    // Build all input types
    for (const inputMetadata of storage.inputTypes) {
      this.getInputType(inputMetadata.target);
    }

    // Build query, mutation, and subscription types
    const queryType = this.buildRootQueryType(storage.queries);
    const mutationType = storage.mutations.length > 0
      ? this.buildRootMutationType(storage.mutations)
      : undefined;
    const subscriptionType = storage.subscriptions.length > 0
      ? this.buildRootSubscriptionType(storage.subscriptions)
      : undefined;

    return new GraphQLSchema({
      query: queryType,
      mutation: mutationType,
      subscription: subscriptionType,
    });
  }

  private static buildEnumType(enumObj: object, name: string, description?: string, valuesConfig?: any): GraphQLEnumType {
    if (this.enumTypesMap.has(enumObj)) {
      return this.enumTypesMap.get(enumObj)!;
    }

    const values: any = {};
    for (const [key, value] of Object.entries(enumObj)) {
      // Skip numeric keys in TypeScript enums
      if (isNaN(Number(key))) {
        values[key] = {
          value: value,
          description: valuesConfig?.[key]?.description,
          deprecationReason: valuesConfig?.[key]?.deprecationReason,
        };
      }
    }

    const enumType = new GraphQLEnumType({
      name,
      description,
      values,
    });

    this.enumTypesMap.set(enumObj, enumType);
    return enumType;
  }

  private static buildRootQueryType(queries: ResolverMetadata[]): GraphQLObjectType {
    const fields: GraphQLFieldConfigMap<any, any> = {};

    for (const query of queries) {
      fields[query.schemaName] = {
        type: this.getGraphQLOutputType(query.getReturnType, query.returnTypeOptions),
        description: query.description,
        args: this.buildArgs(query),
        resolve: this.createResolver(query),
      };
    }

    return new GraphQLObjectType({
      name: "Query",
      fields,
    });
  }

  private static buildRootSubscriptionType(subscriptions: SubscriptionMetadata[]): GraphQLObjectType {
    const fields: GraphQLFieldConfigMap<any, any> = {};

    for (const sub of subscriptions) {
      const subscribeFn = sub.filterFn
        ? this.withFilter(sub.subscribeFn, sub.filterFn)
        : sub.subscribeFn;

      fields[sub.schemaName] = {
        type: this.getGraphQLOutputType(sub.getReturnType, sub.returnTypeOptions),
        description: sub.description,
        args: this.buildArgs(sub),
        subscribe: async (root: any, args: any, context: any, info: any) => {
          const storage = getMetadataStorage();
          const authMeta = storage.authMetadata.find(
            a => a.target === sub.target && a.methodName === sub.methodName
          );
          if (authMeta) {
            await this.checkAuthorization(authMeta, context);
          }
          return subscribeFn(root, args, context, info);
        },
        resolve: this.createResolver(sub),
      };
    }

    return new GraphQLObjectType({ name: "Subscription", fields });
  }

  private static withFilter(
    subscribeFn: SubscriptionMetadata['subscribeFn'],
    filterFn: NonNullable<SubscriptionMetadata['filterFn']>,
  ): SubscriptionMetadata['subscribeFn'] {
    return async function* (root: any, args: any, ctx: any, info: any) {
      const iterator = await subscribeFn(root, args, ctx, info);
      for await (const payload of iterator) {
        if (await filterFn(payload, args, ctx)) {
          yield payload;
        }
      }
    };
  }

  private static buildRootMutationType(mutations: ResolverMetadata[]): GraphQLObjectType {
    const fields: GraphQLFieldConfigMap<any, any> = {};

    for (const mutation of mutations) {
      fields[mutation.schemaName] = {
        type: this.getGraphQLOutputType(mutation.getReturnType, mutation.returnTypeOptions),
        description: mutation.description,
        args: this.buildArgs(mutation),
        resolve: this.createResolver(mutation),
      };
    }

    return new GraphQLObjectType({
      name: "Mutation",
      fields,
    });
  }

  private static buildArgs(metadata: ResolverMetadata): any {
    const args: any = {};
    const storage = getMetadataStorage();

    // Get params from storage for this resolver method
    const params = storage.params
      .filter(p => p.target === metadata.target && p.methodName === metadata.methodName)
      .sort((a, b) => a.index - b.index);

    for (const param of params) {
      if (param.kind === "arg" && param.name && param.getType) {
        args[param.name] = {
          type: this.getGraphQLInputType(param.getType, param.typeOptions || {}),
        };
      }
    }

    return args;
  }

  private static createResolver(metadata: ResolverMetadata): GraphQLFieldResolver<any, any> {
    return async (root, args, context, info) => {
      const storage = getMetadataStorage();

      // Check authorization
      const authMeta = storage.authMetadata.find(
        a => a.target === metadata.target && a.methodName === metadata.methodName
      );

      if (authMeta) {
        await this.checkAuthorization(authMeta, context);
      }

      // Get middleware
      const middlewareMeta = storage.middlewareMetadata.find(
        m => m.target === metadata.target && m.methodName === metadata.methodName
      );

      // Create the actual resolver function
      const executeResolver = async () => {
        // Create resolver instance
        const instance = new (metadata.target as any)();

        // Get all params for this method
        const params = storage.params
          .filter(p => p.target === metadata.target && p.methodName === metadata.methodName)
          .sort((a, b) => a.index - b.index);

        // Build arguments array
        const resolverArgs: any[] = [];
        for (const param of params) {
          switch (param.kind) {
            case "arg":
              resolverArgs[param.index] = args[param.name!];
              break;
            case "ctx":
              resolverArgs[param.index] = context;
              break;
            case "root":
              resolverArgs[param.index] = root;
              break;
            case "info":
              resolverArgs[param.index] = info;
              break;
          }
        }

        // Call resolver method
        return instance[metadata.methodName](...resolverArgs);
      };

      // Apply middleware if present
      if (middlewareMeta && middlewareMeta.middleware.length > 0) {
        return this.applyMiddleware(middlewareMeta.middleware, { args, context, info, root }, executeResolver);
      }

      // No middleware, execute directly
      return executeResolver();
    };
  }

  private static async checkAuthorization(authMeta: any, context: any): Promise<void> {
    // Get auth checker from options
    const authChecker = this.options?.authChecker;

    if (!authChecker) {
      throw new Error(
        "@Authorized() decorator used but no authChecker provided in buildSchema options"
      );
    }

    const isAuthorized = await authChecker(context, authMeta.roles);

    if (!isAuthorized) {
      throw new Error("Access denied! You don't have permission to perform this action.");
    }
  }

  private static async applyMiddleware(
    middleware: any[],
    ctx: { args: any; context: any; info: any; root?: any },
    finalHandler: () => Promise<any>
  ): Promise<any> {
    let index = 0;

    const next = async (): Promise<any> => {
      if (index >= middleware.length) {
        return finalHandler();
      }

      const currentMiddleware = middleware[index++];
      return currentMiddleware(ctx, next);
    };

    return next();
  }

  private static getObjectType(target: Function): GraphQLObjectType {
    // Check cache
    if (this.objectTypesMap.has(target)) {
      return this.objectTypesMap.get(target)!;
    }

    const storage = getMetadataStorage();
    const objectMetadata = storage.objectTypes.find(o => o.target === target);
    if (!objectMetadata) {
      throw new Error(`Object type metadata not found for ${target.name}`);
    }

    // Create the type first with lazy fields to break circular references
    const type = new GraphQLObjectType({
      name: objectMetadata.name,
      description: objectMetadata.description,
      fields: () => {
        // Get fields for this type (including inherited fields)
        const fieldMetadatas = storage.fields.filter(f =>
          f.target === target || target.prototype instanceof (f.target as any)
        );

        const fields: GraphQLFieldConfigMap<any, any> = {};
        for (const field of fieldMetadatas) {
          fields[field.name] = {
            type: this.getGraphQLOutputType(field.getType, field.typeOptions),
            description: field.description,
          };
        }

        // Add field resolvers
        // Find resolver classes that target this object type
        const resolverClasses = storage.resolverClasses.filter(
          rc => rc.objectType === target
        );

        for (const resolverClass of resolverClasses) {
          // Find field resolvers for this resolver class
          const fieldResolvers = storage.fieldResolvers.filter(
            fr => fr.target === resolverClass.target
          );

          for (const fieldResolver of fieldResolvers) {
            const fieldName = fieldResolver.schemaName;

            // Create or update field with resolver
            fields[fieldName] = {
              type: this.getGraphQLOutputType(fieldResolver.getReturnType, fieldResolver.returnTypeOptions),
              description: fieldResolver.description,
              resolve: this.createResolver(fieldResolver),
            };
          }
        }

        return fields;
      },
    });

    // Cache the type before building fields (breaks circular references)
    this.objectTypesMap.set(target, type);
    return type;
  }

  private static getInputType(target: Function): GraphQLInputObjectType {
    // Check cache
    if (this.inputTypesMap.has(target)) {
      return this.inputTypesMap.get(target)!;
    }

    const storage = getMetadataStorage();
    const inputMetadata = storage.inputTypes.find(i => i.target === target);
    if (!inputMetadata) {
      throw new Error(`Input type metadata not found for ${target.name}`);
    }

    // Get fields for this type (including inherited fields)
    const fieldMetadatas = storage.fields.filter(f =>
      f.target === target || target.prototype instanceof (f.target as any)
    );

    const fields: GraphQLInputFieldConfigMap = {};
    for (const field of fieldMetadatas) {
      fields[field.name] = {
        type: this.getGraphQLInputType(field.getType, field.typeOptions),
        description: field.description,
      };
    }

    const type = new GraphQLInputObjectType({
      name: inputMetadata.name,
      description: inputMetadata.description,
      fields,
    });

    this.inputTypesMap.set(target, type);
    return type;
  }

  private static getGraphQLOutputType(getType: () => Function | object | symbol, typeOptions: any): GraphQLOutputType {
    const type = getType();
    let gqlType: GraphQLOutputType;

    // Handle object types (classes with @ObjectType decorator)
    if (typeof type === "function") {
      const storage = getMetadataStorage();
      const isObjectType = storage.objectTypes.some(o => o.target === type);

      if (isObjectType) {
        gqlType = this.getObjectType(type);
      } else {
        // Try to convert scalar
        gqlType = this.convertScalarType(type);
      }
    } else {
      gqlType = this.convertScalarType(type);
    }

    // Handle array
    if (typeOptions.array) {
      gqlType = new GraphQLList(gqlType);
    }

    // Handle nullable
    if (!typeOptions.nullable) {
      gqlType = new GraphQLNonNull(gqlType);
    }

    return gqlType;
  }

  private static getGraphQLInputType(getType: () => Function | object | symbol, typeOptions: any): GraphQLInputType {
    const type = getType();
    let gqlType: GraphQLInputType;

    // Handle input types (classes with @InputType decorator)
    if (typeof type === "function") {
      const storage = getMetadataStorage();
      const isInputType = storage.inputTypes.some(i => i.target === type);

      if (isInputType) {
        gqlType = this.getInputType(type);
      } else {
        // Try to convert scalar
        gqlType = this.convertScalarType(type) as GraphQLInputType;
      }
    } else {
      gqlType = this.convertScalarType(type) as GraphQLInputType;
    }

    // Handle array
    if (typeOptions.array) {
      gqlType = new GraphQLList(gqlType);
    }

    // Handle nullable
    if (!typeOptions.nullable) {
      gqlType = new GraphQLNonNull(gqlType);
    }

    return gqlType;
  }

  private static convertScalarType(type: any): any {
    // Handle built-in JavaScript types
    if (type === String) return GraphQLString;
    if (type === Number) return GraphQLFloat;
    if (type === Boolean) return GraphQLBoolean;
    if (type === Date) return GraphQLString;  // Simplified - could be custom scalar

    // Handle GraphQL built-in types directly
    if (type === GraphQLString || type === GraphQLInt || type === GraphQLFloat ||
        type === GraphQLBoolean || type === GraphQLID) {
      return type;
    }

    // Check if it's a registered enum
    if (this.enumTypesMap.has(type)) {
      return this.enumTypesMap.get(type)!;
    }

    // Handle custom scalars (like GraphQLScalars.JSONResolver from graphql-scalars)
    // Check if it's a GraphQL scalar type by looking for scalar-specific properties
    if (type && typeof type === 'object' && (type.name || type._scalarConfig)) {
      return type;
    }

    throw new Error(`Cannot convert type ${type} to GraphQL type`);
  }

  static clear() {
    this.objectTypesMap.clear();
    this.inputTypesMap.clear();
    this.enumTypesMap.clear();
  }
}
