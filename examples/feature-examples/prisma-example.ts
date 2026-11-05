import "reflect-metadata";
import {  buildSchema,  } from "type-prisma-gql";
import * as Resolvers from "./generated/Resolvers";


async function main() {
  const schema = await buildSchema({
    resolvers: Object.values(Resolvers),
  });

  console.log("✅ Schema created successfully from Prisma-generated types!");
  console.log("\n📋 Generated from schema.prisma:");
  console.log("  - User model → User.ts (@ObjectType)");
  console.log("  - Post model → Post.ts (@ObjectType)");
  console.log("\n🔍 Available queries:");
  console.log("  - getUser(id: Int!): User!");
  console.log("  - getUsers: [User!]!");
  console.log("  - getPost(id: Int!): Post!");
  console.log("  - getPosts: [Post!]!");
  console.log("\n📦 GraphQL Types:");
  console.log("  - User { id, email, name, createdAt }");
  console.log("  - Post { id, title, content, published, authorId, createdAt }");
}

main().catch(console.error);
