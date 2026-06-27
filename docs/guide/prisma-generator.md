# Prisma Generator

`type-prisma-gql` ships with a built-in Prisma generator that produces TypeGraphQL types directly from your `schema.prisma`.

## Setup

In your `schema.prisma`, add the generator:

```prisma
generator typegraphql {
  provider = "type-prisma-gql"
  output   = "./generated"
}
```

Then run:

```bash
npx prisma generate
```

This generates TypeGraphQL types in `./generated/` matching your Prisma models.

## What gets generated

Given this Prisma schema:

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id        Int    @id @default(autoincrement())
  title     String
  content   String?
  author    User   @relation(fields: [authorId], references: [id])
  authorId  Int
}
```

The generator produces:

- `@ObjectType()` classes for `User` and `Post`
- `@InputType()` classes for create/update inputs
- Field resolvers for relations
- Enum types (if your schema has enums)

## Using generated types

```typescript
import { User, Post, CreateUserInput } from './generated'
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

## Re-generating after schema changes

Run `npx prisma generate` any time you modify `schema.prisma`. The generator overwrites the output directory.

## Local development setup

When working within a local repo (not via the installed npm package), point the provider to the generator script directly:

```prisma
generator typegraphql {
  provider = "node ../packages/type-prisma-gql/generator/index.js"
  output   = "./generated"
}
```
