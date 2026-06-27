# Type Utilities

Type utilities let you create derived types from existing ones without code duplication. All utilities support **nested relation selection**.

## Quick Reference

| Utility | Purpose | Nested Support |
|---------|---------|----------------|
| `Pick` | Select specific fields | Yes |
| `Omit` | Exclude specific fields | Yes |
| `Partial` | Make fields optional | Yes |
| `Required` | Make fields required | No |

## Pick

Creates a new type with only the specified fields.

```typescript
import { Pick } from 'type-prisma-gql'

const UserPublicInfo = Pick(User, {
  id: true,
  email: true,
  name: true
}, { isInput: false })
```

**With nested relations:**

```typescript
const UserWithSelectedPosts = Pick(User, {
  id: true,
  email: true,
  posts: {
    id: true,
    title: true
  }
}, { isInput: false })
```

Generated schema:

```graphql
type UserWithSelectedPosts {
  id: Int!
  email: String!
  posts: [PostPick1]
}

type PostPick1 {
  id: Int!
  title: String!
}
```

## Omit

Creates a new type excluding the specified fields.

```typescript
import { Omit } from 'type-prisma-gql'

const SafeUser = Omit(User, {
  password: true
}, { isInput: false })
```

**With nested omission:**

```typescript
const UserWithFilteredPosts = Omit(User, {
  password: true,
  posts: {
    content: true
  }
}, { isInput: false })
```

## Partial

Makes specified fields optional (nullable). Pass `null` as the field selector to make all fields optional.

```typescript
import { Partial } from 'type-prisma-gql'

// Make all fields optional — ideal for update inputs
const UpdateUserInput = Partial(CreateUserInput)

// Make specific fields optional
const UserOptionalName = Partial(CreateUserInput, { name: true })
```

## Required

Makes specified fields non-nullable.

```typescript
import { Required } from 'type-prisma-gql'

const StrictUserInput = Required(UserInput)

// Or specific fields
const UserRequiredName = Required(UserInput, { name: true })
```

> Note: `Required` does not currently support nested relations.

## Options

All utilities accept an optional `options` parameter:

```typescript
{ isInput?: boolean }
```

- `isInput: true` (default) — produces an `@InputType()` for arguments
- `isInput: false` — produces an `@ObjectType()` for return types

## Composing utilities

Utilities can be chained:

```typescript
// Remove read-only fields, then make the rest optional
const UpdateUserInput = Partial(
  Omit(User, { id: true, createdAt: true })
)

// List view — minimal fields
const UserListItem = Pick(User, { id: true, name: true, avatar: true })

// Detail view — richer, but still no password
const UserDetail = Omit(
  Pick(User, { id: true, email: true, name: true, posts: { id: true, title: true } }),
  { password: true }
)
```

## Type safety

Field names are validated by TypeScript at compile time:

```typescript
// Valid
Pick(User, { id: true, email: true })

// TypeScript error — field doesn't exist
Pick(User, { invalidField: true })
```
