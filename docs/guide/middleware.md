# Middleware

Middleware is built-in — no extra dependencies needed.

## Creating middleware

A middleware function receives the resolver context and a `next` function:

```typescript
import { MiddlewareFunction } from 'type-prisma-gql'

const loggerMiddleware: MiddlewareFunction = async (ctx, next) => {
  console.log(`[${new Date().toISOString()}] ${ctx.info.fieldName}`)
  const result = await next()
  return result
}
```

The context object contains:

| Field | Description |
|-------|-------------|
| `args` | Resolver arguments |
| `context` | GraphQL context |
| `info` | GraphQL resolve info |
| `root` | Parent resolver result (field resolvers only) |

## Applying middleware

Use `@UseMiddleware()` on resolver methods. Multiple middleware run in the order declared:

```typescript
import { UseMiddleware } from 'type-prisma-gql'

@Resolver()
class UserResolver {
  @UseMiddleware(loggerMiddleware)
  @Query(() => [User])
  async users() {
    return prisma.user.findMany()
  }

  @UseMiddleware(loggerMiddleware, errorHandlerMiddleware)
  @Mutation(() => User)
  async createUser(@Arg('data', () => CreateUserInput) data: CreateUserInput) {
    return prisma.user.create({ data })
  }
}
```

## Common patterns

**Error handling:**

```typescript
const errorHandlerMiddleware: MiddlewareFunction = async (ctx, next) => {
  try {
    return await next()
  } catch (error) {
    console.error(`Error in ${ctx.info.fieldName}:`, error)
    throw new Error('Something went wrong')
  }
}
```

**Performance monitoring:**

```typescript
const performanceMiddleware: MiddlewareFunction = async (ctx, next) => {
  const start = Date.now()
  const result = await next()
  const duration = Date.now() - start
  if (duration > 1000) {
    console.warn(`Slow resolver: ${ctx.info.fieldName} took ${duration}ms`)
  }
  return result
}
```

**Simple caching:**

```typescript
const cache = new Map<string, unknown>()

const cacheMiddleware: MiddlewareFunction = async (ctx, next) => {
  const key = `${ctx.info.fieldName}:${JSON.stringify(ctx.args)}`
  if (cache.has(key)) return cache.get(key)
  const result = await next()
  cache.set(key, result)
  return result
}
```

**Rate limiting:**

```typescript
const requestCounts = new Map<string, number>()

const rateLimitMiddleware: MiddlewareFunction = async (ctx, next) => {
  const userId = ctx.context.user?.id
  if (!userId) return next()

  const count = requestCounts.get(userId) ?? 0
  if (count > 100) throw new Error('Rate limit exceeded')

  requestCounts.set(userId, count + 1)
  return next()
}
```
