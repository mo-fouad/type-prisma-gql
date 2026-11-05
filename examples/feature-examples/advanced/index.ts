// Complete Registration
import {PrismaClient} from "@prisma/client";
import {Mutation, Resolver, Ctx, InputType, Field, GraphQLInt, Arg, Pick,} from "type-prisma-gql";
import {User} from "../generated";
import {IsNotEmpty, IsString,  Length, Matches } from "class-validator";


interface Context {
  prisma: PrismaClient;
}


@InputType()
export class UserRoleInput {
  @Field(_type => GraphQLInt, { nullable: false })
  roleId: number;
}

@InputType() // Maybe we don't need it at all. !
export class ConnectUserRoleInput {
  @Field(_type => UserRoleInput, { nullable: false })
  connect: UserRoleInput;
}

@InputType()
export class CompleteRegisterInputPick extends Pick(User, {}
,'input') {

}

@InputType()
export class CompleteRegisterInput {
  @Field(_type => String, { nullable: false })
  @IsString({ message: 'Tag name must be a string' })
  @IsNotEmpty({ message: 'Tag name is required' })
  @Length(3, 30, { message: 'Tag name must be between 3 and 30 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Tag name can only contain letters, numbers, and underscores'
  })
  tagName!: string;

  @Field(_type => ConnectUserRoleInput, { nullable: false })
  userRole!: ConnectUserRoleInput;

  @Field(_type => ConnectUserGenderInput, { nullable: false })
  userGender!: ConnectUserGenderInput;
}

@InputType()
export class FindUserByIdInput {
  @Field(_type => String, { nullable: false })
  @IsString({ message: 'User ID must be a string' })
  @IsNotEmpty({ message: 'User ID is required' })
  @Length(20, 30, { message: 'Invalid user ID format' })
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Invalid user ID format' })
  userId: string;
}





@Resolver(() => User)
export class AuthCrud {

@Mutation(_returns => User)
async completeRegister(
  @Ctx() { prisma }: Context,
  @Arg('data', () => CompleteRegisterInput) data: CompleteRegisterInput,
  @Arg('where', () => FindUserByIdInput) where: FindUserByIdInput,
  ) {
  // should Create New Tokens and Save it and store in it the {useId, Email, roleId}
     console.log(data, where)
   /// do something here
  } catch (err) {
    console.log(err);
  }
}
}