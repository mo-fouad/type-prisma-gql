# Type Utilities - Complete Guide

This guide covers the powerful type transformation utilities in type-prisma-gql.

## Overview

Type utilities allow you to create derived types from existing ones without code duplication. All utilities support **nested relation selection** for working with complex object graphs.

## Quick Reference

| Utility | Purpose | Nested Support |
|---------|---------|----------------|
| `Pick` | Select specific fields | ✅ Yes |
| `Omit` | Exclude specific fields | ✅ Yes |
| `Partial` | Make fields optional | ✅ Yes |
| `Required` | Make fields required | ❌ No |

---

## Pick - Select Specific Fields

### Basic Usage

```typescript
const UserPublicInfo = Pick(User, {
  id: true,
  email: true,
  name: true
}, { isInput: false });
```

**Result:** Only includes `id`, `email`, and `name` fields.

### Nested Selection

```typescript
const UserWithSelectedPosts = Pick(User, {
  id: true,
  email: true,
  posts: {
    id: true,
    title: true
  }
}, { isInput: false });
```

**Generated Schema:**
```graphql
type UserWithSelectedPosts {
  id: Int!
  email: String!
  posts: [PostPick1]
}

type PostPick1 {
  id: Int!
  title: String!  # Only selected fields
}
```

### Use Cases

1. **API DTOs** - Return only necessary fields
2. **Performance** - Reduce payload size
3. **Privacy** - Hide sensitive fields
4. **GraphQL Projections** - Match your GraphQL query structure

---

## Omit - Exclude Specific Fields

### Basic Usage

```typescript
const SafeUser = Omit(User, {
  password: true
}, { isInput: false });
```

**Result:** Includes all fields except `password`.

### Nested Omission

```typescript
const UserWithFilteredPosts = Omit(User, {
  password: true,
  posts: {
    content: true  // Keep posts, but remove content
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
  posts: [PostOmit1]
}

type PostOmit1 {
  id: Int!
  title: String!  # content excluded
}
```

### Use Cases

1. **Security** - Remove sensitive fields (passwords, tokens)
2. **Nested Privacy** - Hide user emails in post authors
3. **Public APIs** - Create safe public-facing types
4. **Read-Only Views** - Remove write-only fields

**Example - Public API:**
```typescript
const PublicPost = Omit(Post, {
  author: {
    email: true,    // Hide author's email
    password: true  // Hide author's password
  }
});
```

---

## Partial - Make Fields Optional

### Basic Usage

```typescript
// Make all fields optional
const UpdateUserInput = Partial(CreateUserInput);

// Make specific fields optional
const UserInputOptionalName = Partial(CreateUserInput, {
  name: true
});
```

### Nested Partial

```typescript
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
  name: String        # Nullable
  bio: String
  posts: [PostPartial1]
}

type PostPartial1 {
  id: Int!
  title: String       # Nullable
  content: String
}
```

### Use Cases

1. **Update Operations** - PATCH/update inputs
2. **Optional Nested Updates** - Update relations optionally
3. **Flexible Inputs** - Allow partial data
4. **Form Handling** - Optional form fields

**Example - Update Input:**
```typescript
// Create a flexible update type
const UpdateUserWithPostsInput = Partial(
  Omit(User, { id: true, createdAt: true }),  // Remove read-only
  null  // Make all remaining optional
);
```

---

## Required - Make Fields Required

### Basic Usage

```typescript
const StrictUserInput = Required(UserInput);

// Or specific fields
const UserInputWithRequiredName = Required(UserInput, {
  name: true
});
```

**Note:** Required does NOT currently support nested relations.

---

## Advanced Patterns

### 1. Combining Utilities

```typescript
// Step-by-step transformation
const Step1 = Pick(User, { id: true, email: true, posts: true });
const Step2 = Partial(Step1, { email: true });

// Or in one go
const FlexibleUser = Partial(
  Pick(User, { id: true, email: true, posts: true }),
  { email: true }
);
```

### 2. Update Input Pattern

```typescript
@InputType()
class CreateUserInput {
  @Field() email!: string;
  @Field() password!: string;
  @Field() name!: string;
}

// Automatically derive update input
const UpdateUserInput = Partial(CreateUserInput);
```

### 3. Nested Privacy Pattern

```typescript
// Remove sensitive data from nested relations
const PublicUserWithPosts = Omit(User, {
  password: true,
  apiToken: true,
  posts: {
    author: {
      email: true,
      password: true
    }
  }
});
```

### 4. DTO Pattern

```typescript
// List view - minimal data
const UserListItem = Pick(User, {
  id: true,
  name: true,
  avatar: true
});

// Detail view - more data, no sensitive fields
const UserDetail = Omit(
  Pick(User, {
    id: true,
    email: true,
    name: true,
    bio: true,
    posts: {
      id: true,
      title: true,
      createdAt: true
    }
  }),
  { password: true }
);
```

---

## Options

All utilities (except Required) accept an `options` parameter:

```typescript
interface Options {
  isInput?: boolean;  // Default: true
}
```

- `isInput: true` - Creates an `@InputType()` (for arguments)
- `isInput: false` - Creates an `@ObjectType()` (for return types)

**Example:**
```typescript
// For query/mutation return types
const UserPublic = Pick(User, { id: true, email: true }, { isInput: false });

// For mutation input arguments
const CreateUserData = Pick(User, { email: true, name: true }, { isInput: true });
```

---

## Type Safety

All utilities are fully type-safe. TypeScript will validate:

1. **Field names** - Must exist on the base type
2. **Nested paths** - Must be valid relation fields
3. **Usage** - Proper typing for InstanceType

```typescript
// ✅ Valid
Pick(User, { id: true, email: true });

// ❌ TypeScript error - field doesn't exist
Pick(User, { invalidField: true });

// ❌ TypeScript error - can't nest on scalar field
Pick(User, { email: { nested: true } });
```

---

## Performance

Type utilities are **build-time transformations** with zero runtime overhead:

- Types are created once during schema building
- No runtime type checking
- Efficient GraphQL schema generation
- Lazy field resolution prevents circular dependency issues

---

## Limitations

1. **Required** doesn't support nested relations yet
2. Deeply nested selections (3+ levels) work but can create many types
3. TypeScript type inference for deeply nested structures may be complex

---

## Testing

Run the type utilities example:

```bash
npm run test:type-utils
```

This demonstrates all features including nested selections.

---

## Summary

Type utilities in type-prisma-gql provide:

✅ **Clean API** - Use `{ field: true }` instead of `{ field: 1 }`
✅ **Nested Selection** - Full support for Pick, Omit, and Partial
✅ **Type Safety** - TypeScript validates everything
✅ **Zero Overhead** - Build-time transformations
✅ **DRY** - Single source of truth
✅ **Composable** - Mix and match utilities

Transform your types with confidence! 🚀
