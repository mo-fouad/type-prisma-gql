import "reflect-metadata";
import { buildSchema } from "type-prisma-gql";
import * as Resolvers from "./generated/Resolvers";
import "./generated/Enums";

async function main() {
  const schema = await buildSchema({
    resolvers: Object.values(Resolvers).filter(r => typeof r === 'function'),
  });

  console.log("✅ Schema created successfully!");
  console.log("\nGenerated schema from Prisma models:");
  console.log("- Types: User, Post, Provider (enum)");
  console.log("- Queries: users, user, posts, post");
  console.log("- Mutations: createUser, updateUser, deleteUser, createPost, updatePost, deletePost");
  console.log("- Field Resolvers: User.posts, Post.author");
}

main().catch(console.error);
