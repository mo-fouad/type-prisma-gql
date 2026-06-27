import { getMetadataStorage } from "../metadata/storage";
import { type MiddlewareFunction } from "../metadata/types";

/**
 * Decorator that applies middleware to a resolver
 * @param middleware Middleware functions to apply
 * @example
 * ```typescript
 * const loggerMiddleware: MiddlewareFunction = async (ctx, next) => {
 *   console.log('Before resolver');
 *   const result = await next();
 *   console.log('After resolver');
 *   return result;
 * };
 *
 * @UseMiddleware(loggerMiddleware)
 * @Query(() => User)
 * currentUser() { ... }
 * ```
 */
export function UseMiddleware(...middleware: MiddlewareFunction[]): MethodDecorator {
  return (prototype: Object, propertyKey: string | symbol) => {
    if (typeof propertyKey === "symbol") {
      throw new Error("Symbol keys are not supported");
    }

    getMetadataStorage().collectMiddlewareMetadata({
      target: prototype.constructor,
      methodName: propertyKey,
      middleware,
    });
  };
}
