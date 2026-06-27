# Authorization

Authorization is built-in — no extra dependencies needed.

## Auth checker function

Define a function that returns `true` to allow access and `false` to deny it:

```typescript
import { AuthCheckerFn } from 'type-prisma-gql'

interface Context {
  user?: {
    id: number
    email: string
    role: string
  }
}

const authChecker: AuthCheckerFn = async (context: Context, roles?: string[]) => {
  if (!context.user) return false

  // No specific role required — just authenticated
  if (!roles || roles.length === 0) return true

  return roles.includes(context.user.role)
}
```

## Register the auth checker

Pass it to `buildSchema`:

```typescript
const schema = await buildSchema({
  resolvers: [UserResolver],
  authChecker,
})
```

## Using @Authorized

```typescript
import { Authorized, Query, Mutation, Ctx } from 'type-prisma-gql'

@Resolver()
class UserResolver {
  // Public — no auth required
  @Query(() => [User])
  async publicUsers() {
    return prisma.user.findMany()
  }

  // Requires authentication (any role)
  @Authorized()
  @Query(() => User)
  async me(@Ctx() ctx: Context) {
    return prisma.user.findUnique({ where: { id: ctx.user!.id } })
  }

  // Requires ADMIN role
  @Authorized(['ADMIN'])
  @Query(() => [User])
  async allUsers() {
    return prisma.user.findMany()
  }

  // Requires ADMIN or MODERATOR
  @Authorized(['ADMIN', 'MODERATOR'])
  @Mutation(() => Boolean)
  async deleteUser(@Arg('id', () => Number) id: number) {
    await prisma.user.delete({ where: { id } })
    return true
  }
}
```

## Error behavior

When authorization fails, the resolver throws:

```
Access denied! You don't have permission to perform this action.
```

This becomes a standard GraphQL error in the response.
