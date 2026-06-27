# Installation

## Requirements

- Node.js >= 18
- TypeScript >= 5.0
- `graphql` >= 16

## Install

```bash
# npm
npm install type-prisma-gql graphql

# pnpm
pnpm add type-prisma-gql graphql

# yarn
yarn add type-prisma-gql graphql
```

## TypeScript config

Enable decorators in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "target": "ES2020",
    "module": "CommonJS"
  }
}
```

## Optional: Validation

If you want input validation, install `class-validator`:

```bash
npm install class-validator
```

See the [Validation guide](/guide/validation) for usage.

## Optional: GraphQL Scalars

For custom scalar types (DateTime, JSON, etc.):

```bash
npm install graphql-scalars
```
