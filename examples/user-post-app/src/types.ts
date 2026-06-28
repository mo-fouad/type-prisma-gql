import { ObjectType, InputType, Field } from 'type-prisma-gql'

@ObjectType()
export class User {
  @Field(() => Number)
  id!: number

  @Field(() => String)
  email!: string

  @Field(() => String)
  name!: string
}

@ObjectType()
export class Post {
  @Field(() => Number)
  id!: number

  @Field(() => String)
  title!: string

  @Field(() => String, { nullable: true })
  content?: string

  @Field(() => Boolean)
  published!: boolean

  @Field(() => User)
  author!: User
}

@InputType()
export class CreateUserInput {
  @Field(() => String)
  email!: string

  @Field(() => String)
  name!: string
}

@InputType()
export class CreatePostInput {
  @Field(() => String)
  title!: string

  @Field(() => String, { nullable: true })
  content?: string

  @Field(() => Number)
  authorId!: number
}
