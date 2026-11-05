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
  GraphQLInt,
  Pick,
  Omit,
  Partial,
} from '../../src';
import { printSchema } from 'graphql';

// ============================================
// BASE MODELS WITH RELATIONS
// ============================================

@ObjectType()
class Post {
  @Field(() => GraphQLInt)
  id!: number;

  @Field()
  title!: string;

  @Field({ nullable: true })
  content?: string;
}

@ObjectType()
class User {
  @Field(() => GraphQLInt)
  id!: number;

  @Field()
  email!: string;

  @Field()
  password!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  bio?: string;

  @Field(() => [Post], { nullable: true })
  posts?: Post[];
}

console.log('='.repeat(70));
console.log('TYPE UTILITIES - NEW API DEMONSTRATION');
console.log('='.repeat(70));

// ============================================
// 1. PICK - Simple Fields
// ============================================

console.log('\n1. PICK - Select Specific Fields (Clean API)');
console.log('-'.repeat(70));

const UserPublicInfo = Pick(User, {
  id: true,
  email: true,
  name: true,
}, { isObject: true });

console.log('✅ Pick(User, { id: true, email: true, name: true })');
console.log('   Creates type with: id, email, name');
console.log('   Excludes: password, bio, posts');

// ============================================
// 2. PICK - With All Posts (Full Relation)
// ============================================

console.log('\n2. PICK - Including Posts (Full Relation)');
console.log('-'.repeat(70));

const UserWithPosts = Pick(User, {
  id: true,
  email: true,
  posts: true,
}, { isObject: true });

console.log('✅ Pick(User, { id: true, email: true, posts: true })');
console.log('   User has: id, email, posts');
console.log('   Posts field included with all its fields');

// ============================================
// 3. PICK - Nested Relation Selection
// ============================================

console.log('\n3. PICK - Nested Relation Selection');
console.log('-'.repeat(70));

const UserWithSelectedPostFields = Pick(User, {
  id: true,
  email: true,
  posts: {
    id: true,
    title: true,
  },
}, { isObject: true });

console.log('✅ Pick(User, {');
console.log('     id: true,');
console.log('     email: true,');
console.log('     posts: { id: true, title: true }');
console.log('   })');
console.log('   User has: id, email, posts');
console.log('   Posts only include: id, title (content excluded)');

// ============================================
// 4. OMIT - Exclude Sensitive Fields
// ============================================

console.log('\n4. OMIT - Exclude Specific Fields');
console.log('-'.repeat(70));

const SafeUser = Omit(User, {
  password: true,
}, { isObject: true });

console.log('✅ Omit(User, { password: true })');
console.log('   Excludes: password');
console.log('   Keeps: all other fields');

console.log('\n5. OMIT - Nested Relation Omission');
console.log('-'.repeat(70));

const UserWithFilteredPosts = Omit(User, {
  password: true,
  posts: {
    content: true,
  },
}, { isObject: true });

console.log('✅ Omit(User, {');
console.log('     password: true,');
console.log('     posts: { content: true }');
console.log('   })');
console.log('   Excludes: password');
console.log('   Posts only include: id, title (content excluded)');

// ============================================
// 6. PARTIAL - Optional Fields for Updates
// ============================================

console.log('\n6. PARTIAL - Make Fields Optional');
console.log('-'.repeat(70));

@InputType()
class CreateUserInput {
  @Field()
  email!: string;

  @Field()
  password!: string;

  @Field()
  name!: string;
}

// Make all fields optional (perfect for updates)
const UpdateUserInput = Partial(CreateUserInput);

console.log('✅ Partial(CreateUserInput)');
console.log('   All fields become optional');
console.log('   Perfect for PATCH/update operations');

// Make only specific fields optional
const UserInputOptionalName = Partial(CreateUserInput, {
  name: true,
});

console.log('\n✅ Partial(CreateUserInput, { name: true })');
console.log('   Only name becomes optional');

console.log('\n7. PARTIAL - Nested Relation Partial');
console.log('-'.repeat(70));

const UserWithPartialPosts = Partial(User, {
  name: true,
  posts: {
    title: true,
  },
}, { isObject: true });

console.log('✅ Partial(User, {');
console.log('     name: true,');
console.log('     posts: { title: true }');
console.log('   })');
console.log('   Makes name optional');
console.log('   Posts have title made optional (id, content unchanged)');

console.log('\n8. PICK with InputType (for mutations)');
console.log('-'.repeat(70));

const UpdateUserWithPostsInput = Pick(User, {
  email: true,
  posts: {
    id: true,
    title: true,
  },
}, { isInput: true });  // InputType for mutation arguments

console.log('✅ Pick(User, {');
console.log('     email: true,');
console.log('     posts: { id: true, title: true }');
console.log('   }, { isInput: true })');
console.log('   Creates InputType (not ObjectType)');
console.log('   Used for mutation arguments');

// ============================================
// 9. BUILD RESOLVERS USING UTILITIES
// ============================================

@Resolver()
class DemoResolver {
  @Query(() => UserPublicInfo)
  publicUser(): InstanceType<typeof UserPublicInfo> {
    return {
      id: 1,
      email: 'user@example.com',
      name: 'John Doe',
    };
  }

  @Query(() => UserWithPosts)
  userWithPosts(): InstanceType<typeof UserWithPosts> {
    return {
      id: 1,
      email: 'user@example.com',
      posts: [
        { id: 1, title: 'First Post', content: 'Content 1' },
        { id: 2, title: 'Second Post', content: null },
      ],
    };
  }

  @Query(() => UserWithSelectedPostFields)
  userWithSelectedPostFields(): InstanceType<typeof UserWithSelectedPostFields> {
    return {
      id: 1,
      email: 'user@example.com',
      posts: [
        { id: 1, title: 'First Post' },
        { id: 2, title: 'Second Post' },
      ],
    };
  }

  @Query(() => SafeUser)
  safeUser(): InstanceType<typeof SafeUser> {
    return {
      id: 1,
      email: 'user@example.com',
      name: 'John Doe',
      bio: 'Developer',
      posts: [],
    };
  }

  @Query(() => UserWithFilteredPosts)
  userWithFilteredPosts(): InstanceType<typeof UserWithFilteredPosts> {
    return {
      id: 1,
      email: 'user@example.com',
      name: 'John Doe',
      bio: 'Developer',
      posts: [
        { id: 1, title: 'First Post' },
        { id: 2, title: 'Second Post' },
      ],
    };
  }

  @Query(() => UserWithPartialPosts)
  userWithPartialPosts(): InstanceType<typeof UserWithPartialPosts> {
    return {
      id: 1,
      email: 'user@example.com',
      name: null,
      bio: 'Developer',
      posts: [
        { id: 1, title: null, content: 'Content 1' },
        { id: 2, title: 'Second Post', content: null },
      ],
    };
  }

  @Mutation(() => User)
  updateUserWithPosts(
    @Arg('data', () => UpdateUserWithPostsInput) data: InstanceType<typeof UpdateUserWithPostsInput>
  ): User {
    console.log('Received update data:', data);
    return {
      id: 1,
      email: data.email,
      password: 'hidden',
      name: 'Updated User',
      bio: 'Updated',
      posts: data.posts,
    };
  }
}

// ============================================
// 10. BUILD AND SHOW SCHEMA
// ============================================

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('BUILDING SCHEMA');
  console.log('='.repeat(70));

  const schema = await buildSchema({
    resolvers: [DemoResolver],
  });

  console.log('\n✅ Schema built successfully!');
  console.log('\n' + '='.repeat(70));
  console.log('GENERATED GRAPHQL SCHEMA');
  console.log('='.repeat(70));
  console.log(printSchema(schema));

  console.log('\n' + '='.repeat(70));
  console.log('KEY IMPROVEMENTS IN NEW API');
  console.log('='.repeat(70));
  console.log('\n✨ Before (old API):');
  console.log('   Pick(User, { id: 1, email: 1 })  ❌ Verbose');
  console.log('\n✨ After (new API):');
  console.log('   Pick(User, { id: true, email: true })  ✅ Clean');
  console.log('\n✨ Nested Relations:');
  console.log('   Pick(User, {');
  console.log('     id: true,');
  console.log('     posts: { id: true, title: true }');
  console.log('   })  ✅ Type-safe nested selection');
  console.log('\n✨ Same clean API for:');
  console.log('   • Pick    - Select fields');
  console.log('   • Omit    - Exclude fields');
  console.log('   • Partial - Make optional');
  console.log('   • Required - Make required');

  console.log('\n' + '='.repeat(70));
  console.log('BENEFITS');
  console.log('='.repeat(70));
  console.log('✓ Type-safe - TypeScript validates field names');
  console.log('✓ Clean syntax - Use true instead of 1');
  console.log('✓ Nested relations - Full support for deep selection');
  console.log('✓ DRY - Single source of truth');
  console.log('✓ Composable - Mix and match utilities');
}

main().catch(console.error);
