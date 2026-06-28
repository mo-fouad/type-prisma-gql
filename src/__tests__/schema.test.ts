import { graphql, GraphQLNonNull, GraphQLList, GraphQLString, GraphQLFloat, GraphQLBoolean } from 'graphql'
import {
  ObjectType, InputType, Field,
  Resolver, Query, Mutation, Arg, Ctx,
  buildSchema,
} from '../index'

// ─── Types ───────────────────────────────────────────────────────────────────

@ObjectType()
class User {
  @Field(() => Number)
  id!: number

  @Field(() => String)
  name!: string

  @Field(() => String, { nullable: true })
  bio?: string
}

@InputType()
class CreateUserInput {
  @Field(() => String)
  name!: string

  @Field(() => String, { nullable: true })
  bio?: string
}

@Resolver()
class UserResolver {
  @Query(() => [User])
  users(): User[] {
    return [{ id: 1, name: 'Alice', bio: undefined }]
  }

  @Query(() => User, { nullable: true })
  user(@Arg('id', () => Number) id: number): User | null {
    return id === 1 ? { id: 1, name: 'Alice', bio: undefined } : null
  }

  @Mutation(() => User)
  createUser(
    @Arg('data', () => CreateUserInput) data: CreateUserInput,
    @Ctx() _ctx: any
  ): User {
    return { id: 2, name: data.name, bio: data.bio }
  }
}

// ─── Schema (shared across tests) ────────────────────────────────────────────

let schema: Awaited<ReturnType<typeof buildSchema>>

beforeAll(async () => {
  schema = await buildSchema({ resolvers: [UserResolver] })
})

// ─── Schema structure ─────────────────────────────────────────────────────────

test('query type has users and user fields', () => {
  const fields = schema.getQueryType()!.getFields()
  expect(fields).toHaveProperty('users')
  expect(fields).toHaveProperty('user')
})

test('mutation type has createUser field', () => {
  const fields = schema.getMutationType()!.getFields()
  expect(fields).toHaveProperty('createUser')
})

test('User type has id, name, bio fields', () => {
  const userType = schema.getType('User') as any
  const fields = userType.getFields()
  expect(fields).toHaveProperty('id')
  expect(fields).toHaveProperty('name')
  expect(fields).toHaveProperty('bio')
})

test('non-nullable fields are wrapped in GraphQLNonNull', () => {
  const userType = schema.getType('User') as any
  const fields = userType.getFields()
  expect(fields.id.type).toBeInstanceOf(GraphQLNonNull)
  expect(fields.name.type).toBeInstanceOf(GraphQLNonNull)
})

test('nullable field bio is not wrapped in GraphQLNonNull', () => {
  const userType = schema.getType('User') as any
  const { type } = userType.getFields().bio
  expect(type).toBeInstanceOf(GraphQLString.constructor)
  expect(type).not.toBeInstanceOf(GraphQLNonNull)
})

test('users query returns list type', () => {
  const { type } = schema.getQueryType()!.getFields().users
  // NonNull(List(...))
  expect(type).toBeInstanceOf(GraphQLNonNull)
  expect((type as GraphQLNonNull<any>).ofType).toBeInstanceOf(GraphQLList)
})

test('CreateUserInput type is registered', () => {
  expect(schema.getType('CreateUserInput')).toBeDefined()
})

// ─── Execution ────────────────────────────────────────────────────────────────

test('users query returns seeded data', async () => {
  const result = await graphql({
    schema,
    source: '{ users { id name } }',
  })
  expect(result.errors).toBeUndefined()
  expect(result.data?.users).toEqual([{ id: 1, name: 'Alice' }])
})

test('user query returns matching user', async () => {
  const result = await graphql({
    schema,
    source: '{ user(id: 1) { id name } }',
  })
  expect(result.errors).toBeUndefined()
  expect(result.data?.user).toEqual({ id: 1, name: 'Alice' })
})

test('user query returns null for unknown id', async () => {
  const result = await graphql({
    schema,
    source: '{ user(id: 999) { id name } }',
  })
  expect(result.errors).toBeUndefined()
  expect(result.data?.user).toBeNull()
})

test('createUser mutation creates a user with the given name', async () => {
  const result = await graphql({
    schema,
    source: 'mutation { createUser(data: { name: "Bob" }) { id name } }',
  })
  expect(result.errors).toBeUndefined()
  expect(result.data?.createUser).toMatchObject({ name: 'Bob' })
})
