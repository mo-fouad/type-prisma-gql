import { graphql } from 'graphql'
import {
  ObjectType, Field,
  Resolver, Query, Arg,
  UseMiddleware, buildSchema,
  type MiddlewareFunction,
} from '../index'

// ─── Types & resolver ────────────────────────────────────────────────────────

@ObjectType()
class Item {
  @Field(() => String)
  value!: string
}

const log: string[] = []

const firstMiddleware: MiddlewareFunction = async (ctx, next) => {
  log.push('first:before')
  const result = await next()
  log.push('first:after')
  return result
}

const secondMiddleware: MiddlewareFunction = async (ctx, next) => {
  log.push('second:before')
  const result = await next()
  log.push('second:after')
  return result
}

const shortCircuitMiddleware: MiddlewareFunction = async (_ctx, _next) => {
  return 'short-circuited'
}

const errorMiddleware: MiddlewareFunction = async (_ctx, _next) => {
  throw new Error('middleware error')
}

@Resolver()
class MiddlewareResolver {
  @UseMiddleware(firstMiddleware, secondMiddleware)
  @Query(() => String)
  ordered(): string {
    log.push('resolver')
    return 'done'
  }

  @UseMiddleware(shortCircuitMiddleware)
  @Query(() => String)
  shortCircuit(): string {
    log.push('resolver:never')
    return 'should not reach'
  }

  @UseMiddleware(errorMiddleware)
  @Query(() => String)
  throws(): string {
    return 'unreachable'
  }

  @Query(() => String)
  noMiddleware(): string {
    return 'direct'
  }
}

let schema: Awaited<ReturnType<typeof buildSchema>>

beforeAll(async () => {
  schema = await buildSchema({ resolvers: [MiddlewareResolver] })
})

beforeEach(() => {
  log.length = 0
})

// ─── Tests ───────────────────────────────────────────────────────────────────

test('middleware runs before and after the resolver in order', async () => {
  const { errors } = await graphql({ schema, source: '{ ordered }' })
  expect(errors).toBeUndefined()
  expect(log).toEqual(['first:before', 'second:before', 'resolver', 'second:after', 'first:after'])
})

test('middleware can short-circuit and skip the resolver', async () => {
  const { data, errors } = await graphql({ schema, source: '{ shortCircuit }' })
  expect(errors).toBeUndefined()
  expect(data?.shortCircuit).toBe('short-circuited')
  expect(log).not.toContain('resolver:never')
})

test('error thrown in middleware surfaces as a GraphQL error', async () => {
  const { errors } = await graphql({ schema, source: '{ throws }' })
  expect(errors).toBeDefined()
  expect(errors![0].message).toBe('middleware error')
})

test('resolver without middleware executes directly', async () => {
  const { data, errors } = await graphql({ schema, source: '{ noMiddleware }' })
  expect(errors).toBeUndefined()
  expect(data?.noMiddleware).toBe('direct')
})

test('middleware receives resolver args in context', async () => {
  const captured: any[] = []
  const capturingMiddleware: MiddlewareFunction = async (ctx, next) => {
    captured.push(ctx.args)
    return next()
  }

  @Resolver()
  class ArgCapture {
    @UseMiddleware(capturingMiddleware)
    @Query(() => String)
    echo(@Arg('msg', () => String) msg: string): string {
      return msg
    }
  }

  const s = await buildSchema({ resolvers: [ArgCapture] })
  await graphql({ schema: s, source: '{ echo(msg: "hello") }' })
  expect(captured[0]).toEqual({ msg: 'hello' })
})
