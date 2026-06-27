# Introduction

`type-prisma-gql` is a lightweight TypeGraphQL alternative optimized for Prisma 7. It provides the familiar decorator-based API with a fraction of the footprint.

## Why type-prisma-gql?

| | type-prisma-gql | TypeGraphQL |
|---|---|---|
| Lines of code | ~700 | 10,254 |
| reflect-metadata | Not required | Required |
| Prisma generator | Built-in | Separate package |
| Dependencies | graphql, tslib | Many |

## Quick Start

### Installation

```bash
npm install type-prisma-gql graphql
```

### Define types

```typescript
import { ObjectType, Field, InputType } from 'type-prisma-gql'

@ObjectType()
class User {
  @Field(() => Number)
  id!: number

  @Field(() => String)
  email!: string

  @Field(() => String)
  name!: string
}

@InputType()
class CreateUserInput {
  @Field(() => String)
  email!: string

  @Field(() => String)
  name!: string
}
```

### Define resolvers

```typescript
import { Resolver, Query, Mutation, Arg } from 'type-prisma-gql'

@Resolver()
class UserResolver {
  @Query(() => [User])
  async users() {
    return prisma.user.findMany()
  }

  @Mutation(() => User)
  async createUser(@Arg('data', () => CreateUserInput) data: CreateUserInput) {
    return prisma.user.create({ data })
  }
}
```

### Build schema

```typescript
import { buildSchema } from 'type-prisma-gql'

const schema = await buildSchema({
  resolvers: [UserResolver],
})
```

That's it. No `reflect-metadata` import, no `experimentalDecorators` fuss beyond what TypeScript already supports.
