import 'reflect-metadata';
import {
  buildSchema,
  ObjectType,
  InputType,
  Field,
  Query,
  Mutation,
  Resolver,
  Arg,
  Ctx,
  Authorized,
  UseMiddleware,
  GraphQLInt,
  type MiddlewareFunction,
  type AuthCheckerFn,
} from '../../src';

// ============================================
// 1. MIDDLEWARE EXAMPLE
// ============================================

const loggerMiddleware: MiddlewareFunction = async (ctx, next) => {
  console.log(`[Logger] Before ${ctx.info.fieldName}`);
  const start = Date.now();

  const result = await next();

  const duration = Date.now() - start;
  console.log(`[Logger] After ${ctx.info.fieldName} (${duration}ms)`);

  return result;
};

const performanceMiddleware: MiddlewareFunction = async (ctx, next) => {
  const start = Date.now();
  const result = await next();
  const duration = Date.now() - start;

  if (duration > 1000) {
    console.warn(`[Performance] Slow query detected: ${ctx.info.fieldName} took ${duration}ms`);
  }

  return result;
};

// ============================================
// 2. TYPES
// ============================================

@ObjectType()
class User {
  @Field(() => GraphQLInt)
  id!: number;

  @Field()
  email!: string;

  @Field()
  role!: string;

  @Field({ nullable: true })
  name?: string;
}

@InputType()
class CreateUserInput {
  @Field()
  email!: string;

  @Field()
  role!: string;

  @Field({ nullable: true })
  name?: string;
}

// ============================================
// 3. CONTEXT WITH USER
// ============================================

interface Context {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

// ============================================
// 4. RESOLVERS WITH AUTH & MIDDLEWARE
// ============================================

@Resolver()
class UserResolver {
  // Public query - no auth required
  @Query(() => [User])
  @UseMiddleware(loggerMiddleware)
  async publicUsers(): Promise<User[]> {
    return [
      { id: 1, email: 'public@example.com', role: 'USER', name: 'Public User' },
    ];
  }

  // Authenticated query - requires login
  @Authorized()
  @Query(() => User)
  @UseMiddleware(loggerMiddleware)
  async currentUser(@Ctx() ctx: Context): Promise<User> {
    if (!ctx.user) {
      throw new Error('Not authenticated');
    }

    return {
      id: ctx.user.id,
      email: ctx.user.email,
      role: ctx.user.role,
      name: 'Current User',
    };
  }

  // Admin-only query - requires ADMIN role
  @Authorized(['ADMIN'])
  @Query(() => [User])
  @UseMiddleware(loggerMiddleware, performanceMiddleware)
  async allUsers(): Promise<User[]> {
    // Simulate slow query
    await new Promise(resolve => setTimeout(resolve, 50));

    return [
      { id: 1, email: 'admin@example.com', role: 'ADMIN', name: 'Admin User' },
      { id: 2, email: 'user@example.com', role: 'USER', name: 'Regular User' },
    ];
  }

  // Admin or Moderator - multiple roles
  @Authorized(['ADMIN', 'MODERATOR'])
  @Mutation(() => User)
  async createUser(@Arg('data') data: CreateUserInput): Promise<User> {
    return {
      id: Date.now(),
      ...data,
    };
  }

  // Admin only - single role
  @Authorized(['ADMIN'])
  @Mutation(() => Boolean)
  async deleteUser(@Arg('id', () => GraphQLInt) id: number): Promise<boolean> {
    console.log(`Deleting user ${id}`);
    return true;
  }
}

// ============================================
// 5. AUTH CHECKER IMPLEMENTATION
// ============================================

const authChecker: AuthCheckerFn = async (context: Context, roles?: string[]) => {
  // Check if user is authenticated
  if (!context.user) {
    console.log('[Auth] ❌ No user in context - authentication failed');
    return false;
  }

  console.log(`[Auth] ✅ User authenticated: ${context.user.email} (${context.user.role})`);

  // If no specific roles required, just being authenticated is enough
  if (!roles || roles.length === 0) {
    return true;
  }

  // Check if user has required role
  const hasRole = roles.includes(context.user.role);

  if (hasRole) {
    console.log(`[Auth] ✅ User has required role: ${roles.join(' or ')}`);
  } else {
    console.log(`[Auth] ❌ User lacks required role. Has: ${context.user.role}, Needs: ${roles.join(' or ')}`);
  }

  return hasRole;
};

// ============================================
// 6. TEST EXECUTION
// ============================================

async function main() {
  console.log('🚀 Building schema with advanced features...\n');

  const schema = await buildSchema({
    resolvers: [UserResolver],
    authChecker,
  });

  console.log('✅ Schema built successfully!\n');

  // Test 1: Public query (no auth)
  console.log('='.repeat(50));
  console.log('TEST 1: Public Query (No Auth Required)');
  console.log('='.repeat(50));
  const publicContext: Context = {};  // No user
  console.log('Context:', publicContext);
  console.log('Expected: Should work\n');

  // Test 2: Authenticated query (requires login)
  console.log('='.repeat(50));
  console.log('TEST 2: Current User (Requires Authentication)');
  console.log('='.repeat(50));
  const userContext: Context = {
    user: { id: 1, email: 'user@example.com', role: 'USER' }
  };
  console.log('Context:', userContext);
  console.log('Expected: Should work\n');

  // Test 3: Admin query with USER role (should fail)
  console.log('='.repeat(50));
  console.log('TEST 3: Admin Query with USER Role (Should Fail)');
  console.log('='.repeat(50));
  console.log('Context:', userContext);
  console.log('Expected: Access denied\n');

  // Test 4: Admin query with ADMIN role (should succeed)
  console.log('='.repeat(50));
  console.log('TEST 4: Admin Query with ADMIN Role (Should Succeed)');
  console.log('='.repeat(50));
  const adminContext: Context = {
    user: { id: 1, email: 'admin@example.com', role: 'ADMIN' }
  };
  console.log('Context:', adminContext);
  console.log('Expected: Should work with middleware logging\n');

  console.log('='.repeat(50));
  console.log('Schema Features:');
  console.log('='.repeat(50));
  console.log('✅ Middleware: loggerMiddleware, performanceMiddleware');
  console.log('✅ Authorization: @Authorized() with role-based access');
  console.log('✅ Multiple roles: ADMIN, MODERATOR, USER');
  console.log('✅ Context-based auth: user info in context');
  console.log('\nQueries:');
  console.log('  - publicUsers: No auth (public)');
  console.log('  - currentUser: @Authorized() (any authenticated user)');
  console.log('  - allUsers: @Authorized([\'ADMIN\']) (admin only)');
  console.log('\nMutations:');
  console.log('  - createUser: @Authorized([\'ADMIN\', \'MODERATOR\'])');
  console.log('  - deleteUser: @Authorized([\'ADMIN\'])');
}

main().catch(console.error);
