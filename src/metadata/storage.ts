// Simple metadata storage - just arrays, no caching
import {
   type FieldMetadata,
   type ObjectClassMetadata,
   type InputClassMetadata,
   type ResolverMetadata,
   type ResolverClassMetadata,
   type ParamMetadata,
   type AuthMetadata,
   type MiddlewareMetadata,
   type EnumMetadata,
   type SubscriptionMetadata,
 } from "./types";

export class MetadataStorage {
  queries: ResolverMetadata[] = [];
  mutations: ResolverMetadata[] = [];
  subscriptions: SubscriptionMetadata[] = [];
  fieldResolvers: ResolverMetadata[] = [];
  objectTypes: ObjectClassMetadata[] = [];
  inputTypes: InputClassMetadata[] = [];
  fields: FieldMetadata[] = [];
  params: ParamMetadata[] = [];
  enums: EnumMetadata[] = [];
  resolverClasses: ResolverClassMetadata[] = [];
  authMetadata: AuthMetadata[] = [];
  middlewareMetadata: MiddlewareMetadata[] = [];

  collectQueryMetadata(metadata: ResolverMetadata) {
    this.queries.push(metadata);
  }

  collectMutationMetadata(metadata: ResolverMetadata) {
    this.mutations.push(metadata);
  }

  collectSubscriptionMetadata(metadata: SubscriptionMetadata) {
    this.subscriptions.push(metadata);
  }

  collectFieldResolverMetadata(metadata: ResolverMetadata) {
    this.fieldResolvers.push(metadata);
  }

  collectObjectMetadata(metadata: ObjectClassMetadata) {
    this.objectTypes.push(metadata);
  }

  collectInputMetadata(metadata: InputClassMetadata) {
    this.inputTypes.push(metadata);
  }

  collectFieldMetadata(metadata: FieldMetadata) {
    this.fields.push(metadata);
  }

  collectParamMetadata(metadata: ParamMetadata) {
    this.params.push(metadata);
  }

  collectResolverClassMetadata(metadata: ResolverClassMetadata) {
    this.resolverClasses.push(metadata);
  }

  collectAuthMetadata(metadata: AuthMetadata) {
    this.authMetadata.push(metadata);
  }

  collectMiddlewareMetadata(metadata: MiddlewareMetadata) {
    this.middlewareMetadata.push(metadata);
  }

  collectEnumMetadata(definition: EnumMetadata) {
    this.enums.push(definition);
  }

  clear() {
    this.queries = [];
    this.mutations = [];
    this.subscriptions = [];
    this.fieldResolvers = [];
    this.objectTypes = [];
    this.inputTypes = [];
    this.fields = [];
    this.params = [];
    this.resolverClasses = [];
    this.authMetadata = [];
    this.middlewareMetadata = [];
    this.enums = [];
  }
}

// Global metadata storage
function getGlobalMetadataStorage(): MetadataStorage {
  const globalScope = global as any;
  if (!globalScope.TypePrismaGQLMetadataStorage) {
    globalScope.TypePrismaGQLMetadataStorage = new MetadataStorage();
  }
  return globalScope.TypePrismaGQLMetadataStorage;
}

export function getMetadataStorage(): MetadataStorage {
  return getGlobalMetadataStorage();
}
