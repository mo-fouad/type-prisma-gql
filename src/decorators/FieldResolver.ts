import { getMetadataStorage } from "../metadata/storage";
import { type ReturnTypeFunc, type TypeOptions } from "../metadata/types";

export interface FieldResolverOptions {
  description?: string;
  nullable?: boolean;
  name?: string;
}

export function FieldResolver(returnTypeFunc: ReturnTypeFunc, options?: FieldResolverOptions): MethodDecorator {
  return (prototype: Object, propertyKey: string | symbol) => {
    if (typeof propertyKey === "symbol") {
      throw new Error("Symbol keys are not supported");
    }

    const opts: FieldResolverOptions = options || {};

    // Get return type
    let getReturnType: () => Function | object;
    const returnTypeOptions: TypeOptions = {};

    getReturnType = () => {
      const returnValue = returnTypeFunc();
      // Handle array syntax: [Type]
      if (Array.isArray(returnValue)) {
        returnTypeOptions.array = true;
        return returnValue[0];
      }
      return returnValue;
    };

    // Handle nullable
    if (opts.nullable !== undefined) {
      returnTypeOptions.nullable = opts.nullable;
    }

    getMetadataStorage().collectFieldResolverMetadata({
      target: prototype.constructor,
      methodName: propertyKey,
      schemaName: opts.name || propertyKey,
      getReturnType,
      returnTypeOptions,
      description: opts.description,
    });
  };
}
