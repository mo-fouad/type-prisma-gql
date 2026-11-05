import "reflect-metadata";
import { buildSchema } from "../src";
import { UserResolver, PostResolver } from "./generated";
import { printSchema } from "graphql";

async function main() {
  // Build schema with all generated resolvers
  const schema = await buildSchema({
    resolvers: [UserResolver, PostResolver],
  });

  console.log("✅ Complete GraphQL Schema Generated!\n");

  // Print the schema
  console.log("📋 Generated Schema:");
  console.log("==================\n");
  const schemaStr = printSchema(schema);
  console.log(schemaStr);

  console.log("\n🔍 Available Operations:");
  console.log("========================\n");
  console.log("Queries:");
  console.log("  - users: [User!]!");
  console.log("  - user(id: Int!): User");
  console.log("  - posts: [Post!]!");
  console.log("  - post(id: Int!): Post");
  console.log("\nMutations:");
  console.log("  - createUser(data: UserCreateInput!): User!");
  console.log("  - updateUser(id: Int!, data: UserUpdateInput!): User!");
  console.log("  - deleteUser(id: Int!): User!");
  console.log("  - createPost(data: PostCreateInput!): Post!");
  console.log("  - updatePost(id: Int!, data: PostUpdateInput!): Post!");
  console.log("  - deletePost(id: Int!): Post!");

  console.log("\n📦 TypeGraphQL Types Generated from Prisma:");
  console.log("============================================\n");
  console.log("Object Types:");
  console.log("  - User { id, email, name, createdAt, posts }");
  console.log("  - Post { id, title, content, published, authorId, author, createdAt }");
  console.log("\nInput Types:");
  console.log("  - UserCreateInput { email, name?, createdAt? }");
  console.log("  - UserUpdateInput { id?, email?, name?, createdAt? }");
  console.log("  - PostCreateInput { title, content?, published?, authorId, createdAt? }");
  console.log("  - PostUpdateInput { id?, title?, content?, published?, authorId?, createdAt? }");
  console.log("\nResolvers:");
  console.log("  - UserResolver (CRUD operations for User)");
  console.log("  - PostResolver (CRUD operations for Post)");

  console.log("\n✨ Everything generated successfully from Prisma schema!");
  console.log("\nTo use with Prisma Client:");
  console.log("  const prisma = new PrismaClient();");
  console.log("  const context = { prisma };");
  console.log("  // Pass context to GraphQL execution");
}

main().catch(console.error);
