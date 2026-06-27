import { getMetadataStorage } from "../metadata/storage";

export type AuthRole = string | string[];

/**
 * Decorator that marks a resolver as requiring authorization
 * @param roles Optional roles required to access this resolver
 * @example
 * ```typescript
 * @Authorized()  // Requires authentication
 * @Query(() => User)
 * currentUser() { ... }
 *
 * @Authorized(['ADMIN'])  // Requires ADMIN role
 * @Mutation(() => User)
 * deleteUser() { ... }
 *
 * @Authorized(['ADMIN', 'MODERATOR'])  // Requires ADMIN or MODERATOR
 * @Query(() => [User])
 * allUsers() { ... }
 * ```
 */
export function Authorized(roles?: AuthRole): MethodDecorator {
  return (prototype: Object, propertyKey: string | symbol) => {
    if (typeof propertyKey === "symbol") {
      throw new Error("Symbol keys are not supported");
    }

    const rolesArray = roles
      ? Array.isArray(roles)
        ? roles
        : [roles]
      : undefined;

    getMetadataStorage().collectAuthMetadata({
      target: prototype.constructor,
      methodName: propertyKey,
      roles: rolesArray,
    });
  };
}
