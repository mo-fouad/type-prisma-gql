# Example App

A complete, runnable example is included in the repository under `examples/user-post-app/`.

## What it covers

- `@ObjectType`, `@InputType`, `@Field` — type definitions
- `@Resolver`, `@Query`, `@Mutation`, `@Arg`, `@Ctx` — resolver setup
- Prisma 7 with SQLite (zero config — no database server needed)
- Apollo Server 5 + Express 5

## Run it locally

```bash
git clone https://github.com/mo-fouad/type-prisma-gql.git
cd type-prisma-gql/examples/user-post-app

npm install
npm run db:setup   # creates SQLite DB and runs migrations
npm run db:seed    # adds sample users and posts
npm run dev        # starts server at http://localhost:4000/graphql
```

Open **http://localhost:4000/graphql** in your browser for the Apollo Sandbox.

## Example queries

```graphql
# Get all users
query {
  users { id email name }
}

# Get published posts with author
query {
  publishedPosts {
    id title content
    author { name }
  }
}

# Create a user
mutation {
  createUser(data: { email: "carol@example.com", name: "Carol" }) {
    id email
  }
}

# Create and publish a post
mutation {
  createPost(data: { title: "Hello world", authorId: 1 }) { id }
}
mutation {
  publishPost(id: 1) { id title published }
}
```

## Project structure

```
examples/user-post-app/
├── prisma/
│   └── schema.prisma    # User + Post models, SQLite
├── src/
│   ├── types.ts         # ObjectType / InputType definitions
│   ├── resolvers.ts     # Resolver classes
│   ├── server.ts        # Apollo Server setup
│   └── seed.ts          # Sample data
├── package.json
└── tsconfig.json
```
