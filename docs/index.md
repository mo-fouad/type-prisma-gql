---
layout: home

hero:
  name: type-prisma-gql
  text: TypeGraphQL for Prisma 7
  tagline: 93% smaller than TypeGraphQL. No reflect-metadata. Just the essentials.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: View on GitHub
      link: https://github.com/mo-fouad/type-prisma-gql
    - theme: alt
      text: npm
      link: https://www.npmjs.com/package/type-prisma-gql

features:
  - title: Lightweight
    details: ~700 lines vs TypeGraphQL's 10,254. Only graphql and tslib as dependencies.
  - title: Familiar API
    details: Same decorators you know — @ObjectType, @Field, @Query, @Mutation, @Arg — so migration is trivial.
  - title: Prisma 7 Optimized
    details: Built-in Prisma generator that produces TypeGraphQL types directly from your schema.prisma.
  - title: Type Utilities
    details: Pick, Omit, Partial, and Required utilities with nested relation support — no code duplication.
  - title: No reflect-metadata
    details: No polyfills, no tsconfig gymnastics. Just install and use.
  - title: Optional Validation
    details: Works seamlessly with class-validator when installed — zero overhead when not.
---
