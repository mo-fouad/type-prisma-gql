import { getMetadataStorage } from "../metadata/storage";
import { type ReturnTypeFunc, type TypeOptions } from "../metadata/types";

export interface ArgOptions {
  description?: string;
  nullable?: boolean;
}

/**
 * @Arg decorator - marks a parameter as a GraphQL argument
 *
 * IMPORTANT: Type function is REQUIRED - no reflect-metadata fallback
 *
 * @example
 * ```typescript
 * @Resolver()
 * class UserResolver {
 *   @Query(() => User)
 *   async user(
 *     @Arg('id', () => GraphQLID) id: string,
 *     @Arg('includeDeleted', () => Boolean, { nullable: true }) includeDeleted?: boolean,
 *   ): Promise<User> {
 *     // ...
 *   }
 *
 *   @Mutation(() => User)
 *   async createUser(
 *     @Arg('data', () => UserCreateInput) data: UserCreateInput,
 *   ): Promise<User> {
 *     // ...
 *   }
 * }
 * ```
 */
export function Arg(name: string, returnTypeFunc: ReturnTypeFunc, options?: ArgOptions): ParameterDecorator {
  return (prototype: Object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    if (!propertyKey || typeof propertyKey === "symbol") {
      throw new Error("Symbol keys are not supported");
    }

    const opts: ArgOptions = options || {};
    const typeOptions: TypeOptions = {};

    // Get type from return type function
    const getType = () => {
      const returnValue = returnTypeFunc();
      // Handle array syntax: [Type]
      if (Array.isArray(returnValue)) {
        typeOptions.array = true;
        return returnValue[0];
      }
      return returnValue;
    };

    // Handle nullable
    if (opts.nullable !== undefined) {
      typeOptions.nullable = opts.nullable;
    }

    getMetadataStorage().collectParamMetadata({
      target: prototype.constructor,
      methodName: propertyKey,
      index: parameterIndex,
      kind: "arg",
      name,
      getType,
      typeOptions,
    });
  };
}
