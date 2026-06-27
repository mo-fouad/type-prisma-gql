# Type-Prisma-GQL

A lightweight TypeGraphQL library optimized for Prisma 7.

## Features

- **93% smaller** than full TypeGraphQL (~700 lines vs 10,254)
- **Simple API** - Just the essentials: @ObjectType, @Field, @Query, @Mutation, @Arg
- **No heavy dependencies** - Only graphql and tslib
- **Prisma-optimized** - Designed for Prisma 7 workflows

## Installation

```bash
npm install type-prisma-gql graphql
```

## Usage

```typescript
import { ObjectType, Field, Query, Resolver, buildSchema } from 'type-prisma-gql';

@ObjectType()
class User {
  @Field()
  id: number;

  @Field()
  email: string;
}

@Resolver()
class UserResolver {
  @Query(() => User)
  getUser() {
    return { id: 1, email: 'test@example.com' };
  }
}

const schema = await buildSchema({
  resolvers: [UserResolver],
});
```

## Status

This is a prototype implementation focusing on core functionality.
