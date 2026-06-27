# Decorators

All decorators are imported from `type-prisma-gql`.

## Type Decorators

### @ObjectType()

Marks a class as a GraphQL object type.

```typescript
import { ObjectType, Field } from 'type-prisma-gql'

@ObjectType()
class User {
  @Field(() => Number)
  id!: number

  @Field(() => String)
  email!: string
}
```

### @InputType()

Marks a class as a GraphQL input type (used for mutation arguments).

```typescript
@InputType()
class CreateUserInput {
  @Field(() => String)
  email!: string

  @Field(() => String)
  password!: string
}
```

### @Field()

Exposes a class property as a GraphQL field.

```typescript
@Field(() => TypeFn, options?)
```

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `nullable` | `boolean` | Makes the field nullable. Default: `false` |
| `description` | `string` | Field description shown in introspection |

```typescript
@ObjectType()
class Post {
  @Field(() => Number)
  id!: number

  @Field(() => String)
  title!: string

  @Field(() => String, { nullable: true })
  content?: string

  @Field(() => String, { description: 'Author email address' })
  authorEmail!: string
}
```

## Resolver Decorators

### @Resolver()

Marks a class as a GraphQL resolver.

```typescript
import { Resolver, Query, Mutation } from 'type-prisma-gql'

@Resolver()
class UserResolver {
  // ...
}
```

### @Query()

Defines a GraphQL query field.

```typescript
@Query(() => ReturnType, options?)
```

```typescript
@Resolver()
class UserResolver {
  @Query(() => [User])
  async users() {
    return prisma.user.findMany()
  }

  @Query(() => User, { nullable: true })
  async user(@Arg('id', () => Number) id: number) {
    return prisma.user.findUnique({ where: { id } })
  }
}
```

### @Mutation()

Defines a GraphQL mutation field.

```typescript
@Resolver()
class UserResolver {
  @Mutation(() => User)
  async createUser(@Arg('data', () => CreateUserInput) data: CreateUserInput) {
    return prisma.user.create({ data })
  }

  @Mutation(() => Boolean)
  async deleteUser(@Arg('id', () => Number) id: number) {
    await prisma.user.delete({ where: { id } })
    return true
  }
}
```

### @Arg()

Defines a resolver argument.

```typescript
@Arg('name', () => Type, options?)
```

```typescript
@Query(() => User, { nullable: true })
async user(
  @Arg('id', () => Number) id: number,
  @Arg('includeDeleted', () => Boolean, { nullable: true }) includeDeleted?: boolean
) {
  return prisma.user.findUnique({ where: { id } })
}
```

### @Ctx()

Injects the GraphQL context into a resolver method.

```typescript
import { Ctx } from 'type-prisma-gql'

interface Context {
  user?: { id: number; role: string }
}

@Resolver()
class UserResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() ctx: Context) {
    if (!ctx.user) return null
    return prisma.user.findUnique({ where: { id: ctx.user.id } })
  }
}
```

## Access Control

### @Authorized()

Restricts access to authenticated users or specific roles. Requires an `authChecker` to be passed to `buildSchema`.

```typescript
import { Authorized } from 'type-prisma-gql'

@Resolver()
class UserResolver {
  // Requires authentication (any role)
  @Authorized()
  @Query(() => User)
  async me(@Ctx() ctx: Context) {
    return ctx.user
  }

  // Requires ADMIN role
  @Authorized(['ADMIN'])
  @Query(() => [User])
  async allUsers() {
    return prisma.user.findMany()
  }
}
```

See the [Authorization guide](/guide/authorization) for setting up the `authChecker`.

## Middleware

### @UseMiddleware()

Applies one or more middleware functions to a resolver method.

```typescript
import { UseMiddleware } from 'type-prisma-gql'

@Resolver()
class UserResolver {
  @UseMiddleware(loggerMiddleware, validationMiddleware)
  @Mutation(() => User)
  async createUser(@Arg('data', () => CreateUserInput) data: CreateUserInput) {
    return prisma.user.create({ data })
  }
}
```

See the [Middleware guide](/guide/middleware) for creating middleware functions.

## buildSchema

Compiles all registered resolvers into an executable GraphQL schema.

```typescript
import { buildSchema } from 'type-prisma-gql'

const schema = await buildSchema({
  resolvers: [UserResolver, PostResolver],
  authChecker,   // optional
})
```

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `resolvers` | `Class[]` | Array of resolver classes |
| `authChecker` | `AuthCheckerFn` | Optional function for `@Authorized` checks |
