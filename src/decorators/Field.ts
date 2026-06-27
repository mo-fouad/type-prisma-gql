import { getMetadataStorage } from "../metadata/storage";
import { type ReturnTypeFunc, type TypeOptions } from "../metadata/types";

export interface FieldOptions {
  description?: string;
  nullable?: boolean | "items" | "itemsAndList";
}

/**
 * @Field decorator - marks a property as a GraphQL field
 *
 * IMPORTANT: Type function is REQUIRED - no reflect-metadata fallback
 *
 * @example
 * ```typescript
 * @ObjectType()
 * class User {
 *   @Field(() => GraphQLID)
 *   id!: string;
 *
 *   @Field(() => String)
 *   name!: string;
 *
 *   @Field(() => [Post])
 *   posts!: Post[];
 *
 *   @Field(() => String, { nullable: true })
 *   bio?: string | null;
 * }
 * ```
 */
export function Field(returnTypeFunc: ReturnTypeFunc, options?: FieldOptions): PropertyDecorator {
  return (prototype: Object, propertyKey: string | symbol) => {
    if (typeof propertyKey === "symbol") {
      throw new Error("Symbol keys are not supported");
    }

    if (!prototype || typeof prototype !== "object") {
      throw new Error("@Field decorator can only be used on class properties");
    }

    const opts: FieldOptions = options || {};
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

    getMetadataStorage().collectFieldMetadata({
      target: prototype.constructor as Function,
      name: propertyKey,
      getType,
      typeOptions,
      description: opts.description,
    });
  };
}
