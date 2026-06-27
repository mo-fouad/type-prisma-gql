import { getMetadataStorage } from "../metadata/storage";
import { type ReturnTypeFunc, type TypeOptions, type SubscribeFn, type FilterFn } from "../metadata/types";

export interface SubscriptionOptions {
  description?: string;
  nullable?: boolean;
  name?: string;
  subscribe: SubscribeFn;
  filter?: FilterFn;
}

export function Subscription(returnTypeFunc: ReturnTypeFunc, options: SubscriptionOptions): MethodDecorator {
  return (prototype: Object, propertyKey: string | symbol) => {
    if (typeof propertyKey === "symbol") {
      throw new Error("Symbol keys are not supported");
    }

    const returnTypeOptions: TypeOptions = {};

    const getReturnType = () => {
      const returnValue = returnTypeFunc();
      if (Array.isArray(returnValue)) {
        returnTypeOptions.array = true;
        return returnValue[0];
      }
      return returnValue;
    };

    if (options.nullable !== undefined) {
      returnTypeOptions.nullable = options.nullable;
    }

    getMetadataStorage().collectSubscriptionMetadata({
      target: prototype.constructor,
      methodName: propertyKey,
      schemaName: options.name || propertyKey,
      getReturnType,
      returnTypeOptions,
      description: options.description,
      subscribeFn: options.subscribe,
      filterFn: options.filter,
    });
  };
}
