import 'reflect-metadata';
import { buildSchema } from '../../src';
import { printSchema } from 'graphql';
import {
  UserResolver,
  PostResolver,
  UserFieldResolver,
  PostFieldResolver,
} from './generated';

async function main() {
  console.log('Building schema with field resolvers...\n');

  const schema = await buildSchema({
    resolvers: [
      UserResolver,
      PostResolver,
      UserFieldResolver,
      PostFieldResolver,
    ],
  });

  console.log('✅ Schema built successfully!\n');
  console.log('Generated GraphQL Schema:');
  console.log('='.repeat(50));
  console.log(printSchema(schema));
  console.log('='.repeat(50));
  console.log('\nField resolvers registered:');
  console.log('  - Post.author -> User');
  console.log('  - User.posts -> [Post]');
}

main().catch(console.error);
