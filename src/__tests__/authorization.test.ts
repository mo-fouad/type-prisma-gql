import { graphql } from 'graphql'
import {
  ObjectType, Field,
  Resolver, Query,
  Authorized, Ctx,
  buildSchema, type AuthCheckerFn,
} from '../index'

// ─── Types & resolver ────────────────────────────────────────────────────────

@ObjectType()
class Secret {
  @Field(() => String)
  value!: string
}

@Resolver()
class AuthResolver {
  @Query(() => String)
  public(): string {
    return 'public'
  }

  @Authorized()
  @Query(() => String)
  protected(@Ctx() _ctx: any): string {
    return 'protected'
  }

  @Authorized(['ADMIN'])
  @Query(() => String)
  adminOnly(@Ctx() _ctx: any): string {
    return 'admin'
  }

  @Authorized(['ADMIN', 'MODERATOR'])
  @Query(() => String)
  adminOrMod(@Ctx() _ctx: any): string {
    return 'mod'
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const authChecker: AuthCheckerFn = (ctx: any, roles?: string[]) => {
  if (!ctx?.user) return false
  if (!roles?.length) return true
  return roles.includes(ctx.user.role)
}

async function exec(source: string, context?: any) {
  const schema = await buildSchema({ resolvers: [AuthResolver], authChecker })
  return graphql({ schema, source, contextValue: context })
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test('public query is accessible without context', async () => {
  const { data, errors } = await exec('{ public }')
  expect(errors).toBeUndefined()
  expect(data?.public).toBe('public')
})

test('protected query is denied when user is not in context', async () => {
  const { errors } = await exec('{ protected }', {})
  expect(errors).toBeDefined()
  expect(errors![0].message).toMatch(/access denied/i)
})

test('protected query succeeds for any authenticated user', async () => {
  const { data, errors } = await exec('{ protected }', { user: { role: 'USER' } })
  expect(errors).toBeUndefined()
  expect(data?.protected).toBe('protected')
})

test('adminOnly query is denied for non-admin role', async () => {
  const { errors } = await exec('{ adminOnly }', { user: { role: 'USER' } })
  expect(errors).toBeDefined()
  expect(errors![0].message).toMatch(/access denied/i)
})

test('adminOnly query succeeds for ADMIN role', async () => {
  const { data, errors } = await exec('{ adminOnly }', { user: { role: 'ADMIN' } })
  expect(errors).toBeUndefined()
  expect(data?.adminOnly).toBe('admin')
})

test('adminOrMod query succeeds for MODERATOR role', async () => {
  const { data, errors } = await exec('{ adminOrMod }', { user: { role: 'MODERATOR' } })
  expect(errors).toBeUndefined()
  expect(data?.adminOrMod).toBe('mod')
})

test('buildSchema without authChecker throws when @Authorized resolver is called', async () => {
  const schema = await buildSchema({ resolvers: [AuthResolver] })
  const { errors } = await graphql({ schema, source: '{ protected }' })
  expect(errors).toBeDefined()
  expect(errors![0].message).toMatch(/authChecker/i)
})
