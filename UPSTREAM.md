# Upstream references

type-prisma-gql is a small rewrite, not a fork. We read the original libraries,
take the ideas we need, and write our own lighter version (no `reflect-metadata`,
Prisma 7 first). This file records **what we took from where, and at which version**,
so upgrades are a diff instead of guesswork.

The originals are downloaded into `reference/` (gitignored) by:

```bash
npm run ref:sync
```

## Pinned versions

| Name | Repo | Commit | Notes |
|---|---|---|---|
| type-graphql | [MichalLytek/type-graphql](https://github.com/MichalLytek/type-graphql) | `58d187e` (2026-01-13) | v2 line. API reference for all decorators and schema building. |
| typegraphql-prisma | [mo-fouad/typegraphql-prisma](https://github.com/mo-fouad/typegraphql-prisma) | `8d5a36a` (2026-01-12) | Our fork of 0.28.0 with the Prisma 7 work. Reference for the generator. |
| type-graphql-utils | [mo-fouad/type-graphql-utils](https://github.com/mo-fouad/type-graphql-utils) | `67c7aac` (2023-07-05) | v2.1.0. Inspiration for Pick / Omit / Partial / Required. |

## What maps to what

| Our file | Based on (in `reference/`) |
|---|---|
| `src/decorators/*.ts` (ObjectType, Field, InputType, Resolver, Query, Mutation, Subscription, FieldResolver, Arg, Ctx, Root, Info, Authorized, UseMiddleware, enums) | `type-graphql/src/decorators/` (same file names) |
| `src/metadata/storage.ts`, `src/metadata/types.ts` | `type-graphql/src/metadata/metadata-storage.ts`, `type-graphql/src/metadata/definitions/` |
| `src/schema/generator.ts`, `src/utils/buildSchema.ts` | `type-graphql/src/schema/schema-generator.ts`, `type-graphql/src/utils/buildSchema.ts` |
| `src/utils/type-helpers.ts` (Pick, Omit, Partial, Required) | `type-graphql-utils/lib/index.ts` |
| `src/validation/validate.ts` | `type-graphql/src/resolvers/validate-arg.ts` |
| `generator/index.js` | `typegraphql-prisma/src/generator.ts`, `typegraphql-prisma/src/generator/generate-code.ts` |
| `generator/type-generators/generateObjectTypes.js` | `typegraphql-prisma/src/generator/model-type-class.ts` |
| `generator/type-generators/generateInputTypes.js` | `typegraphql-prisma/src/generator/type-class.ts` |
| `generator/type-generators/generateEnum.js` | `typegraphql-prisma/src/generator/enum.ts` |
| `generator/type-generators/generateResolvers.js` | `typegraphql-prisma/src/generator/resolvers/full-crud.ts` |
| `generator/type-generators/generateFieldResolvers.js` | `typegraphql-prisma/src/generator/resolvers/relations.ts` |

## Deliberate differences

- **No `reflect-metadata`.** Types are always explicit: `@Field(() => String)`.
- **Prisma 7 only.** No support for older Prisma versions.
- Much smaller surface: no interfaces, unions, directives or extensions (yet).

## Upgrading from upstream

1. Change the commit in `scripts/sync-reference.sh` and run `npm run ref:sync`.
2. See what changed in the files we track:
   ```bash
   cd reference/type-graphql
   git diff <old-commit>..<new-commit> -- src/decorators src/metadata src/schema src/utils
   ```
3. Port the fixes that apply, add a test for each one, and update the table above.
