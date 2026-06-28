import { graphql, GraphQLNonNull } from 'graphql'
import {
  ObjectType, InputType, Field,
  Resolver, Query, Arg,
  Pick, Omit, Partial, Required,
  buildSchema,
} from '../index'

// ─── Base types ───────────────────────────────────────────────────────────────

@ObjectType()
class Post {
  @Field(() => Number)
  id!: number

  @Field(() => String)
  title!: string

  @Field(() => String, { nullable: true })
  content?: string
}

@ObjectType()
class Author {
  @Field(() => Number)
  id!: number

  @Field(() => String)
  email!: string

  @Field(() => String)
  password!: string

  @Field(() => String, { nullable: true })
  bio?: string

  @Field(() => [Post])
  posts!: Post[]
}

@InputType()
class CreateAuthorInput {
  @Field(() => String)
  email!: string

  @Field(() => String)
  password!: string

  @Field(() => String, { nullable: true })
  bio?: string
}

// ─── Pick ─────────────────────────────────────────────────────────────────────

describe('Pick', () => {
  @ObjectType()
  class AuthorPublic extends Pick(Author, { id: true, email: true }) {}

  @Resolver()
  class PickResolver {
    @Query(() => AuthorPublic)
    author(): any {
      return { id: 1, email: 'a@a.com', password: 'secret' }
    }
  }

  let schema: any
  beforeAll(async () => { schema = await buildSchema({ resolvers: [PickResolver] }) })

  test('Pick produces a type with only the selected fields', () => {
    const type = schema.getType('AuthorPublic') as any
    const fields = Object.keys(type.getFields())
    expect(fields).toContain('id')
    expect(fields).toContain('email')
    expect(fields).not.toContain('password')
    expect(fields).not.toContain('bio')
    expect(fields).not.toContain('posts')
  })

  test('query returns only picked fields', async () => {
    const { data, errors } = await graphql({ schema, source: '{ author { id email } }' })
    expect(errors).toBeUndefined()
    expect(data?.author).toEqual({ id: 1, email: 'a@a.com' })
  })
})

// ─── Omit ─────────────────────────────────────────────────────────────────────

describe('Omit', () => {
  @ObjectType()
  class SafeAuthor extends Omit(Author, { password: true }) {}

  @Resolver()
  class OmitResolver {
    @Query(() => SafeAuthor)
    safeAuthor(): any {
      return { id: 1, email: 'a@a.com', bio: 'hello', posts: [] }
    }
  }

  let schema: any
  beforeAll(async () => { schema = await buildSchema({ resolvers: [OmitResolver] }) })

  test('Omit produces a type without the omitted field', () => {
    const type = schema.getType('SafeAuthor') as any
    const fields = Object.keys(type.getFields())
    expect(fields).not.toContain('password')
    expect(fields).toContain('email')
    expect(fields).toContain('id')
  })

  test('query on SafeAuthor returns data without password', async () => {
    const { data, errors } = await graphql({ schema, source: '{ safeAuthor { id email } }' })
    expect(errors).toBeUndefined()
    expect(data?.safeAuthor).toMatchObject({ id: 1, email: 'a@a.com' })
  })
})

// ─── Partial ─────────────────────────────────────────────────────────────────

describe('Partial', () => {
  @InputType()
  class UpdateAuthorInput extends Partial(CreateAuthorInput, null, 'input') {}

  @ObjectType()
  class AuthorResult {
    @Field(() => String)
    email!: string
  }

  @Resolver()
  class PartialResolver {
    @Query(() => AuthorResult)
    updateAuthor(@Arg('data', () => UpdateAuthorInput) data: any): any {
      return { email: data.email ?? 'unchanged' }
    }
  }

  let schema: any
  beforeAll(async () => { schema = await buildSchema({ resolvers: [PartialResolver] }) })

  test('Partial makes all fields nullable in the input type', () => {
    const type = schema.getType('UpdateAuthorInput') as any
    const fields = type.getFields()
    // None of the fields should be NonNull (all should be nullable)
    for (const field of Object.values(fields) as any[]) {
      expect(field.type).not.toBeInstanceOf(GraphQLNonNull)
    }
  })

  test('mutation with partial input works when fields are omitted', async () => {
    const { data, errors } = await graphql({
      schema,
      source: '{ updateAuthor(data: {}) { email } }',
    })
    expect(errors).toBeUndefined()
    expect((data?.updateAuthor as any)?.email).toBe('unchanged')
  })
})

// ─── Required ─────────────────────────────────────────────────────────────────

describe('Required', () => {
  @InputType()
  class StrictInput extends Required(CreateAuthorInput, null, 'input') {}

  @ObjectType()
  class StrictResult {
    @Field(() => String)
    email!: string
  }

  @Resolver()
  class RequiredResolver {
    @Query(() => StrictResult)
    strict(@Arg('data', () => StrictInput) data: any): any {
      return { email: data.email }
    }
  }

  let schema: any
  beforeAll(async () => { schema = await buildSchema({ resolvers: [RequiredResolver] }) })

  test('Required makes nullable fields non-null', () => {
    const type = schema.getType('StrictInput') as any
    const fields = type.getFields()
    // bio was nullable on CreateAuthorInput — Required should make it NonNull
    expect(fields.bio.type).toBeInstanceOf(GraphQLNonNull)
  })

  test('already-required fields remain non-null', () => {
    const type = schema.getType('StrictInput') as any
    const fields = type.getFields()
    expect(fields.email.type).toBeInstanceOf(GraphQLNonNull)
    expect(fields.password.type).toBeInstanceOf(GraphQLNonNull)
  })
})
