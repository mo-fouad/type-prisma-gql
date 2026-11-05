# Feature examples (legacy)

Saved from the old `type-prisma-mono/apps/example` playground (January 2026),
where most of the library features were first built and tried out.

**These do not compile against the current API.** They were written before
`reflect-metadata` was removed, so many fields use `@Field()` without an explicit
type function. Several also import from `./generated`, the generator's output,
which isn't checked in here (run `prisma generate` against `schema.prisma` to
recreate it).

Use them as a record of what each feature was meant to do. Bring an example up to
date before turning it into a docs page or a test.

| File | Shows |
|---|---|
| `type-utilities-example.ts` | Pick / Omit / Partial / Required, including nested relations |
| `validation-example.ts` | class-validator integration |
| `advanced-features-example.ts` | Authorization, middleware, validation together |
| `advanced/index.ts` | Prisma connect pattern, Pick on generated models |
| `test-field-resolvers.ts` | Generated field resolvers for relations |
| `test-types.ts` | Nested Pick type checks |
| `complete-example.ts`, `prisma-example.ts`, `schema.ts`, `index.ts` | Full schema built from generated Prisma types, served with Apollo |
| `schema.prisma`, `prisma.config.ts` | Prisma 7 schema used by the examples above |
