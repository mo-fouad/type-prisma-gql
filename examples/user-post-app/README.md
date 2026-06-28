# Example: User + Post App

A minimal GraphQL API with Users and Posts using `type-prisma-gql`, Prisma, and Apollo Server.

## Stack

- **type-prisma-gql** — decorators and schema builder
- **Prisma 7** — database ORM (SQLite, zero config)
- **Apollo Server 5** — GraphQL server
- **Express 5** — HTTP server

## Get started

```bash
# 1. Install dependencies
npm install

# 2. Create the database and run migrations
npm run db:setup

# 3. Seed with sample data
npm run db:seed

# 4. Start the server
npm run dev
```

Open Apollo Sandbox at **http://localhost:4000/graphql**

## Example queries

```graphql
# List all users
query {
  users {
    id
    email
    name
  }
}

# List published posts with author
query {
  publishedPosts {
    id
    title
    content
    author {
      name
      email
    }
  }
}

# Create a user
mutation {
  createUser(data: { email: "carol@example.com", name: "Carol" }) {
    id
    email
  }
}

# Create a post
mutation {
  createPost(data: { title: "New post", authorId: 1 }) {
    id
    title
    author { name }
  }
}

# Publish a post
mutation {
  publishPost(id: 2) {
    id
    title
    published
  }
}
```

## Project structure

```
src/
├── types.ts      # @ObjectType and @InputType definitions
├── resolvers.ts  # @Resolver classes with @Query and @Mutation
├── server.ts     # Apollo Server + Express setup
└── seed.ts       # Sample data
prisma/
└── schema.prisma # Prisma schema (SQLite)
```
