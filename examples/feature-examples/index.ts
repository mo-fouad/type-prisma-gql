// import "reflect-metadata";
import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import {} from "graphql/type";
import {
  buildSchema,
  Field,
  InputType,
  ObjectType,
  Pick,
  GraphQLID,
  Resolver,
  Query,
  Mutation,
  Arg,
  Ctx
} from "type-prisma-gql";
import {Prisma, PrismaClient} from "@prisma/client";
import {Profile} from "./generated";
// import * as Resolvers from "./generated/Resolvers";
import { Provider } from "./generated/Enums";  // Import from generated to register enum

import { PrismaPg } from "@prisma/adapter-pg";
import { User} from "./generated/Models/User";

interface Context {
  prisma: PrismaClient;
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });


@InputType()
export class UserCreateInput implements Prisma.UserUncheckedCreateInput {
  @Field(() => Provider)
  provider!: Provider;

  @Field(() => String)
  email!: string;
}


@InputType()
export class UserCreateInputPick extends Pick(User, {
  provider:true,
  providerId:true,
  email: true,
  password: true,
}, 'input')  {}


// Define the nested profile type with a stable, explicit name
@ObjectType()
export class UserReturnProfile extends Pick(Profile, {
  roleId:true,
}) {}

// Use the class reference for the nested relation - stable naming!
@ObjectType()
export class UserReturn extends Pick(User, {
  userId:true,
  provider:true,
  providerId:true,
  email: 'optional',
  profile: UserReturnProfile  // Class reference instead of inline { roleId: true }
}) {}

export async function testUserReturn(
     user: UserReturn,
 ) {
  const {userId, profile} = user;
  const roleId = profile.roleId

}


  @Resolver()
export class UserResolver {

  @Query(() => String)
  hello(): string {
    return "Hello World!";
  }

  @Query(() => [UserReturn])
  getAllUsers(@Ctx() {prisma}: Context): Promise<UserReturn[]> {
    return prisma.user.findMany({
      select:{
        userId:true,
        provider:true,
        providerId:true,
        profile:{
          select:{roleId:true}
        }
      }
    })
  }

  @Mutation(() => UserReturn)
  async createUser(@Arg('data', ()=>UserCreateInput) data: UserCreateInput, @Ctx() ctx: Context) : Promise<User> {
    return ctx.prisma.user.create({ data: data  }) ;
  }

  @Mutation(() => UserReturn)
  async createUserWithPick(
      @Arg('data', ()=>UserCreateInputPick) data: UserCreateInputPick,
      @Ctx() ctx: Context
    ) : Promise<UserReturn> {
    return ctx.prisma.user.create({ data: data, include: {profile:true}}) ;
  }

}

async function startServer() {
  const app = express();

  const schema = await buildSchema({
    resolvers: [UserResolver]  //Object.values(UserResolver).filter(r => typeof r === 'function'),
  });

  const server = new ApolloServer({
    schema,
  });

  await server.start();

  app.use(
    "/gql",
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async () => ({ prisma }),
    })
  );

  app.listen(4000, () => {
    console.log("Server running at http://localhost:4000/gql");
  });
}

startServer().catch(console.error);
