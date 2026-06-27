# Advanced Features Guide

This document covers the features available in type-prisma-gql: **Type Utilities**, **Validation**, **Authorization**, and **Middleware**.

## Table of Contents
1. [Type Utilities](#type-utilities)
2. [Validation](#validation)
3. [Authorization](#authorization)
4. [Middleware](#middleware)
5. [Complete Example](#complete-example)

---

## Type Utilities

TypeGraphQL Lite provides powerful type transformation utilities inspired by TypeScript's utility types. These help you create derived types from existing ones without code duplication.

### Available Utilities

- **Pick** - Select specific fields from a type
- **Omit** - Exclude specific fields from a type
- **Partial** - Make fields optional
- **Required** - Make fields required

All utilities support **nested relation selection** for working with complex object graphs.

---

### Pick

Creates a new type with only the specified fields.

**Basic Usage:**
```typescript
import { Pick } from 'type-prisma-gql';

@ObjectType()
class User {
  @Field(() => Number) id!: number;
  @Field(() => String) email!: string;
  @Field(() => String) password!: string;
  @Field(() => String) name!: string;
  @Field(() => [Post]) posts?: Post[];
}

// Select specific fields
const UserPublicInfo = Pick(User, {
  id: true,
  email: true,
  name: true
}, { isInput: false });
// Result: Only has id, email, name fields
```

**Nested Selection:**
```typescript
// Pick fields from nested relations
const UserWithSelectedPosts = Pick(User, {
  id: true,
  email: true,
  posts: {
    id: true,
    title: true  // Only select id and title from Post
  }
}, { isInput: false });
```

**Generated Schema:**
```graphql
type UserWithSelectedPosts {
  id: Int!
  email: String!
  posts: [PostPick1]  # Custom filtered Post type
}

type PostPick1 {
  id: Int!
  title: String!  # Only selected fields
}
```

---

### Omit

Creates a new type excluding the specified fields.

**Basic Usage:**
```typescript
import { Omit } from 'type-prisma-gql';

// Remove sensitive fields
const SafeUser = Omit(User, {
  password: true
}, { isInput: false });
// Result: Has all fields except password
```

**Nested Omission:**
```typescript
// Omit fields from nested relations
const UserWithFilteredPosts = Omit(User, {
  password: true,
  posts: {
    content: true  // Keep posts, but remove content field
  }
}, { isInput: false });
```

**Generated Schema:**
```graphql
type UserWithFilteredPosts {
  id: Int!
  email: String!
  name: String!
  bio: String
  posts: [PostOmit1]  # Custom filtered Post type
}

type PostOmit1 {
  id: Int!
  title: String!  # content field excluded
}
```

**Use Cases:**
- Hiding sensitive data (passwords, tokens)
- Removing fields from nested relations (e.g., hide user email in post author)
- Creating public-facing API types

---

### Partial

Makes specified fields optional (nullable).

**Basic Usage:**
```typescript
import { Partial } from 'type-prisma-gql';

@InputType()
class CreateUserInput {
  @Field(() => String) email!: string;
  @Field(() => String) password!: string;
  @Field(() => String) name!: string;
}

// Make all fields optional (perfect for update operations)
const UpdateUserInput = Partial(CreateUserInput);

// Make only specific fields optional
const UserInputOptionalName = Partial(CreateUserInput, {
  name: true
});
```

**Nested Partial:**
```typescript
// Make fields optional in nested relations
const UserWithPartialPosts = Partial(User, {
  name: true,
  posts: {
    title: true  // Make title optional in Post
  }
}, { isInput: false });
```

**Generated Schema:**
```graphql
type UserWithPartialPosts {
  id: Int!
  email: String!
  password: String!
  name: String        # Nullable now
  bio: String
  posts: [PostPartial1]
}

type PostPartial1 {
  id: Int!
  title: String       # Nullable now
  content: String
}
```

**Use Cases:**
- Update/PATCH input types
- Optional nested updates
- Flexible query inputs

---

### Required

Makes specified fields required (non-nullable).

**Usage:**
```typescript
import { Required } from 'type-prisma-gql';

@InputType()
class UserInput {
  @Field(() => String) email!: string;
  @Field(() => String, { nullable: true }) name?: string;
  @Field(() => String, { nullable: true }) bio?: string;
}

// Make all fields required
const StrictUserInput = Required(UserInput);

// Make only name required
const UserInputWithRequiredName = Required(UserInput, {
  name: true
});
```

---

### Type Utility Options

All utilities accept an optional `options` parameter:

```typescript
{
  isInput?: boolean;  // true = InputType, false = ObjectType
}
```

**Example:**
```typescript
// For mutations/queries (use ObjectType)
const UserPublic = Pick(User, { id: true, email: true }, { isInput: false });

// For input arguments (use InputType)
const CreateUserData = Pick(User, { email: true, name: true }, { isInput: true });
```

---

### Combining Utilities

You can combine utilities to create complex derived types:

```typescript
// Start with User type
// 1. Pick specific fields
const UserSubset = Pick(User, { id: true, email: true, posts: true });

// 2. Make some fields optional
const FlexibleUserSubset = Partial(UserSubset, { email: true });

// Or chain in one go:
const UserUpdateInput = Partial(
  Omit(User, { id: true, createdAt: true }), // Remove read-only fields
  null  // Make all remaining fields optional
);
```

---

### Best Practices

1. **Use Pick for DTOs**: Create focused data transfer objects
   ```typescript
   const UserListItem = Pick(User, { id: true, name: true, avatar: true });
   ```

2. **Use Omit for Security**: Remove sensitive data
   ```typescript
   const PublicUser = Omit(User, { password: true, apiToken: true });
   ```

3. **Use Partial for Updates**: PATCH/update operations
   ```typescript
   const UpdateUserInput = Partial(UserCreateInput);
   ```

4. **Nested Selection for Efficiency**: Only fetch what you need
   ```typescript
   const UserWithPostTitles = Pick(User, {
     id: true,
     posts: { id: true, title: true }  // Don't fetch post content
   });
   ```

5. **Type Safety**: TypeScript validates field names at compile time
   ```typescript
   // ❌ TypeScript error - field doesn't exist
   Pick(User, { invalidField: true });
   ```

---

## Validation

### Setup

Validation is **opt-in** and requires installing `class-validator`:

```bash
npm install class-validator
```

If not installed, validation features are simply not available (no errors thrown).

### Using Validation Decorators

Import validation decorators from `class-validator`:

```typescript
import { IsEmail, MinLength, MaxLength, Min, Max } from 'class-validator';
import { InputType, Field } from 'type-prisma-gql';

@InputType()
class CreateUserInput {
  @Field(() => String)
  @IsEmail()
  email!: string;

  @Field(() => String)
  @MinLength(8)
  @MaxLength(50)
  password!: string;

  @Field(() => String, { nullable: true })
  @MaxLength(100)
  name?: string;
}
```

### Validation Options

**Option 1: Manual Validation**
```typescript
import { validateObject, ValidationFailedError } from 'type-prisma-gql';

@Mutation(() => User)
async createUser(@Arg('data', () => CreateUserInput) data: CreateUserInput) {
  try {
    await validateObject(data);
  } catch (error) {
    if (error instanceof ValidationFailedError) {
      // Handle validation errors
      console.log(error.validationErrors);
    }
  }

  return prisma.user.create({ data });
}
```

**Option 2: Validation Middleware**
```typescript
import { UseMiddleware, MiddlewareFunction } from 'type-prisma-gql';

const validationMiddleware: MiddlewareFunction = async (ctx, next) => {
  // Validate all input arguments
  for (const [key, value] of Object.entries(ctx.args)) {
    if (value && typeof value === 'object') {
      await validateObject(value);
    }
  }
  return next();
};

@UseMiddleware(validationMiddleware)
@Mutation(() => User)
async createUser(@Arg('data', () => CreateUserInput) data: CreateUserInput) {
  // Data is already validated here
  return prisma.user.create({ data });
}
```

### Available Validation Decorators

From `class-validator`:
- `@IsEmail()` - Email format
- `@MinLength(n)` / `@MaxLength(n)` - String length
- `@Min(n)` / `@Max(n)` - Number range
- `@IsInt()` / `@IsNumber()` - Number type
- `@IsBoolean()` - Boolean type
- `@IsOptional()` - Optional field
- `@IsDate()` - Date validation
- `@Matches(regex)` - Regex pattern
- And many more! See [class-validator docs](https://github.com/typestack/class-validator)

---

## Authorization

### Setup

No additional dependencies required! Authorization is built-in.

### Auth Checker Function

Define an auth checker function that verifies user permissions:

```typescript
import { AuthCheckerFn } from 'type-prisma-gql';

interface Context {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

const authChecker: AuthCheckerFn = async (context: Context, roles?: string[]) => {
  // Check if user is authenticated
  if (!context.user) {
    return false;
  }

  // If no specific roles required, just being authenticated is enough
  if (!roles || roles.length === 0) {
    return true;
  }

  // Check if user has any of the required roles
  return roles.includes(context.user.role);
};
```

### Using @Authorized Decorator

```typescript
import { Authorized, Query, Mutation } from 'type-prisma-gql';

@Resolver()
class UserResolver {
  // Public - no auth required
  @Query(() => [User])
  async publicUsers() {
    return prisma.user.findMany();
  }

  // Requires authentication (any role)
  @Authorized()
  @Query(() => User)
  async currentUser(@Ctx() ctx: Context) {
    return prisma.user.findUnique({ where: { id: ctx.user!.id } });
  }

  // Requires ADMIN role
  @Authorized(['ADMIN'])
  @Query(() => [User])
  async allUsers() {
    return prisma.user.findMany();
  }

  // Requires ADMIN OR MODERATOR role
  @Authorized(['ADMIN', 'MODERATOR'])
  @Mutation(() => User)
  async deleteUser(@Arg('id', () => Number) id: number) {
    return prisma.user.delete({ where: { id } });
  }
}
```

### Registering Auth Checker

Pass the auth checker to `buildSchema`:

```typescript
const schema = await buildSchema({
  resolvers: [UserResolver],
  authChecker,  // Your auth checker function
});
```

### Error Handling

When authorization fails:
```typescript
// Throws: "Access denied! You don't have permission to perform this action."
```

---

## Middleware

### Setup

No additional dependencies required! Middleware is built-in.

### Creating Middleware

Middleware functions have access to the resolver context and can:
- Log requests/responses
- Transform arguments
- Measure performance
- Handle errors
- Add caching
- And more!

```typescript
import { MiddlewareFunction } from 'type-prisma-gql';

const loggerMiddleware: MiddlewareFunction = async (ctx, next) => {
  console.log(`Before: ${ctx.info.fieldName}`);
  const start = Date.now();

  const result = await next();

  const duration = Date.now() - start;
  console.log(`After: ${ctx.info.fieldName} (${duration}ms)`);

  return result;
};

const errorHandlerMiddleware: MiddlewareFunction = async (ctx, next) => {
  try {
    return await next();
  } catch (error) {
    console.error('Error in resolver:', error);
    throw new Error('Something went wrong');
  }
};
```

### Using @UseMiddleware Decorator

```typescript
import { UseMiddleware } from 'type-prisma-gql';

@Resolver()
class UserResolver {
  // Single middleware
  @UseMiddleware(loggerMiddleware)
  @Query(() => [User])
  async users() {
    return prisma.user.findMany();
  }

  // Multiple middleware (executed in order)
  @UseMiddleware(loggerMiddleware, errorHandlerMiddleware)
  @Query(() => User)
  async user(@Arg('id', () => Number) id: number) {
    return prisma.user.findUnique({ where: { id } });
  }
}
```

### Middleware Context

Middleware functions receive a context object with:

```typescript
{
  args: any;       // Resolver arguments
  context: any;    // GraphQL context
  info: any;       // GraphQL info
  root?: any;      // Parent resolver result (for field resolvers)
}
```

### Common Middleware Patterns

**Performance Monitoring**
```typescript
const performanceMiddleware: MiddlewareFunction = async (ctx, next) => {
  const start = Date.now();
  const result = await next();
  const duration = Date.now() - start;

  if (duration > 1000) {
    console.warn(`Slow query: ${ctx.info.fieldName} took ${duration}ms`);
  }

  return result;
};
```

**Caching**
```typescript
const cache = new Map();

const cacheMiddleware: MiddlewareFunction = async (ctx, next) => {
  const key = `${ctx.info.fieldName}-${JSON.stringify(ctx.args)}`;

  if (cache.has(key)) {
    console.log('Cache hit!');
    return cache.get(key);
  }

  const result = await next();
  cache.set(key, result);
  return result;
};
```

**Rate Limiting**
```typescript
const requestCounts = new Map<string, number>();

const rateLimitMiddleware: MiddlewareFunction = async (ctx, next) => {
  const userId = ctx.context.user?.id;
  if (!userId) return next();

  const count = requestCounts.get(userId) || 0;
  if (count > 100) {
    throw new Error('Rate limit exceeded');
  }

  requestCounts.set(userId, count + 1);
  return next();
};
```

---

## Complete Example

Here's a full example combining all three features:

```typescript
import {
  buildSchema,
  ObjectType,
  InputType,
  Field,
  Query,
  Mutation,
  Resolver,
  Arg,
  Ctx,
  Authorized,
  UseMiddleware,
  validateObject,
  type MiddlewareFunction,
  type AuthCheckerFn,
} from 'type-prisma-gql';
import { IsEmail, MinLength } from 'class-validator';

// Types
@ObjectType()
class User {
  @Field(() => Number)
  id!: number;

  @Field(() => String)
  email!: string;

  @Field(() => String)
  role!: string;
}

@InputType()
class CreateUserInput {
  @Field(() => String)
  @IsEmail()
  email!: string;

  @Field(() => String)
  @MinLength(8)
  password!: string;
}

// Context
interface Context {
  user?: { id: number; email: string; role: string };
}

// Middleware
const loggerMiddleware: MiddlewareFunction = async (ctx, next) => {
  console.log(`[${new Date().toISOString()}] ${ctx.info.fieldName}`);
  return next();
};

const validationMiddleware: MiddlewareFunction = async (ctx, next) => {
  for (const [key, value] of Object.entries(ctx.args)) {
    if (value && typeof value === 'object') {
      await validateObject(value);
    }
  }
  return next();
};

// Auth Checker
const authChecker: AuthCheckerFn = async (context: Context, roles?: string[]) => {
  if (!context.user) return false;
  if (!roles || roles.length === 0) return true;
  return roles.includes(context.user.role);
};

// Resolver
@Resolver()
class UserResolver {
  // Public endpoint - no auth, with logging
  @UseMiddleware(loggerMiddleware)
  @Query(() => [User])
  async users() {
    return [{ id: 1, email: 'user@example.com', role: 'USER' }];
  }

  // Authenticated endpoint - requires login
  @Authorized()
  @UseMiddleware(loggerMiddleware)
  @Query(() => User)
  async currentUser(@Ctx() ctx: Context) {
    return ctx.user!;
  }

  // Admin endpoint with validation
  @Authorized(['ADMIN'])
  @UseMiddleware(loggerMiddleware, validationMiddleware)
  @Mutation(() => User)
  async createUser(@Arg('data', () => CreateUserInput) data: CreateUserInput) {
    // Data is validated and user is authorized
    return { id: 2, email: data.email, role: 'USER' };
  }
}

// Build Schema
const schema = await buildSchema({
  resolvers: [UserResolver],
  authChecker,
});
```

---

## Best Practices

1. **Validation**: Always validate user input, especially for mutations
2. **Authorization**: Use role-based access control (RBAC) for sensitive operations
3. **Middleware**: Keep middleware functions small and focused on one concern
4. **Order Matters**: Middleware executes in the order specified in `@UseMiddleware(...)`
5. **Error Handling**: Use try-catch in middleware for proper error handling
6. **Performance**: Be cautious with expensive operations in middleware (they run on every request)

---

## Testing

Run the example files to see these features in action:

```bash
# Test authorization and middleware
npm run test:advanced

# Test validation
npm run test:validation

# Test field resolvers
npm run test:field-resolvers
```

---

## Future Enhancements

Planned features:
- Global middleware configuration
- Class-level middleware (apply to all resolvers in a class)
- Automatic validation via `buildSchema({ validate: true })`
- More built-in middleware (caching, rate limiting, etc.)
