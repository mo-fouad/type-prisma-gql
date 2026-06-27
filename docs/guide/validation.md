# Validation

Validation is **opt-in** and requires `class-validator`.

## Setup

```bash
npm install class-validator
```

If not installed, validation features are simply not available — no errors thrown.

## Using validation decorators

Import decorators from `class-validator` and combine them with `@Field`:

```typescript
import { IsEmail, MinLength, MaxLength } from 'class-validator'
import { InputType, Field } from 'type-prisma-gql'

@InputType()
class CreateUserInput {
  @Field(() => String)
  @IsEmail()
  email!: string

  @Field(() => String)
  @MinLength(8)
  @MaxLength(50)
  password!: string

  @Field(() => String, { nullable: true })
  @MaxLength(100)
  name?: string
}
```

## Option 1: Manual validation

```typescript
import { validateObject, ValidationFailedError } from 'type-prisma-gql'

@Mutation(() => User)
async createUser(@Arg('data', () => CreateUserInput) data: CreateUserInput) {
  try {
    await validateObject(data)
  } catch (error) {
    if (error instanceof ValidationFailedError) {
      console.log(error.validationErrors)
      throw error
    }
  }
  return prisma.user.create({ data })
}
```

## Option 2: Validation middleware

Apply validation automatically to all inputs in a resolver:

```typescript
import { UseMiddleware, MiddlewareFunction, validateObject } from 'type-prisma-gql'

const validationMiddleware: MiddlewareFunction = async (ctx, next) => {
  for (const [, value] of Object.entries(ctx.args)) {
    if (value && typeof value === 'object') {
      await validateObject(value)
    }
  }
  return next()
}

@UseMiddleware(validationMiddleware)
@Mutation(() => User)
async createUser(@Arg('data', () => CreateUserInput) data: CreateUserInput) {
  return prisma.user.create({ data })
}
```

## Common validators

From `class-validator`:

| Decorator | Description |
|-----------|-------------|
| `@IsEmail()` | Email format |
| `@MinLength(n)` / `@MaxLength(n)` | String length |
| `@Min(n)` / `@Max(n)` | Number range |
| `@IsInt()` | Integer |
| `@IsBoolean()` | Boolean |
| `@IsOptional()` | Skip validation when undefined |
| `@IsDate()` | Date |
| `@Matches(regex)` | Regex pattern |

See the [class-validator docs](https://github.com/typestack/class-validator) for the full list.
