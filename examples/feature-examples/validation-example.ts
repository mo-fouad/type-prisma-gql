import 'reflect-metadata';
import {
  buildSchema,
  ObjectType,
  InputType,
  Field,
  Mutation,
  Resolver,
  Arg,
  validateObject,
  ValidationFailedError,
  isValidationEnabled,
  UseMiddleware,
  type MiddlewareFunction,
} from '../../src';

// ============================================
// IMPORTANT: This example requires class-validator
// Install with: npm install class-validator
// ============================================

console.log('📦 Checking if class-validator is installed...');
if (isValidationEnabled()) {
  console.log('✅ class-validator is installed\n');
} else {
  console.log('❌ class-validator is NOT installed');
  console.log('Install it with: npm install class-validator');
  console.log('\nThis example will show the API, but validation won\'t actually run.\n');
}

// ============================================
// 1. INPUT WITH VALIDATION (REQUIRES class-validator)
// ============================================

// When class-validator is installed, you can use decorators like:
// @IsEmail(), @MinLength(), @MaxLength(), @IsInt(), etc.
//
// For this example, we show the API without requiring class-validator
// to be installed (since it's an optional peer dependency)

@InputType()
class CreateProductInput {
  // Would use: @MinLength(3) @MaxLength(100)
  @Field()
  name!: string;

  // Would use: @Min(0)
  @Field()
  price!: number;

  // Would use: @IsOptional() @MaxLength(500)
  @Field({ nullable: true })
  description?: string;
}

@ObjectType()
class Product {
  @Field()
  id!: number;

  @Field()
  name!: string;

  @Field()
  price!: number;

  @Field({ nullable: true })
  description?: string;
}

// ============================================
// 2. VALIDATION MIDDLEWARE
// ============================================

/**
 * Middleware that validates input arguments using class-validator
 */
const validationMiddleware: MiddlewareFunction = async (ctx, next) => {
  console.log('[Validation] Checking arguments...');

  // Get all arguments
  const args = ctx.args;

  // Validate each argument that's an object
  for (const [key, value] of Object.entries(args)) {
    if (value && typeof value === 'object' && value.constructor !== Object) {
      // This is a class instance, validate it
      try {
        await validateObject(value);
        console.log(`[Validation] ✅ ${key} is valid`);
      } catch (error) {
        if (error instanceof ValidationFailedError) {
          console.log(`[Validation] ❌ ${key} validation failed:`);
          error.validationErrors.forEach(err => {
            console.log(`  - ${err.property}: ${Object.values(err.constraints).join(', ')}`);
          });
          throw error;
        }
        throw error;
      }
    }
  }

  return next();
};

// ============================================
// 3. RESOLVER WITH VALIDATION
// ============================================

@Resolver()
class ProductResolver {
  private products: Product[] = [];
  private nextId = 1;

  // Manual validation example
  @Mutation(() => Product)
  async createProduct(@Arg('data') data: CreateProductInput): Promise<Product> {
    // Manual validation
    if (!data.name || data.name.length < 3) {
      throw new Error('Product name must be at least 3 characters');
    }

    if (data.price < 0) {
      throw new Error('Product price must be positive');
    }

    const product: Product = {
      id: this.nextId++,
      ...data,
    };

    this.products.push(product);
    console.log(`[Product] ✅ Created: ${product.name} ($${product.price})`);

    return product;
  }

  // With validation middleware (requires class-validator)
  @UseMiddleware(validationMiddleware)
  @Mutation(() => Product)
  async createProductWithValidation(@Arg('data') data: CreateProductInput): Promise<Product> {
    // Validation happens in middleware
    // If we reach here, data is valid

    const product: Product = {
      id: this.nextId++,
      ...data,
    };

    this.products.push(product);
    console.log(`[Product] ✅ Created with validation: ${product.name} ($${product.price})`);

    return product;
  }
}

// ============================================
// 4. TEST EXECUTION
// ============================================

async function main() {
  console.log('🚀 Building schema with validation...\n');

  const schema = await buildSchema({
    resolvers: [ProductResolver],
  });

  console.log('✅ Schema built successfully!\n');

  console.log('='.repeat(60));
  console.log('VALIDATION FEATURE OVERVIEW');
  console.log('='.repeat(60));
  console.log('\n1. Optional Dependency:');
  console.log('   - class-validator is an optional peer dependency');
  console.log('   - Install only if you need validation: npm install class-validator');
  console.log('   - If not installed, validation features are simply not available');

  console.log('\n2. Validation Decorators (from class-validator):');
  console.log('   - @IsEmail() - validates email format');
  console.log('   - @MinLength(n) - minimum string length');
  console.log('   - @MaxLength(n) - maximum string length');
  console.log('   - @Min(n) - minimum number value');
  console.log('   - @Max(n) - maximum number value');
  console.log('   - @IsInt() - must be integer');
  console.log('   - @IsOptional() - field is optional');
  console.log('   - ... and many more!');

  console.log('\n3. Using Validation:');
  console.log('   Option A: Manual validation with validateObject()');
  console.log('   Option B: Automatic validation with middleware');
  console.log('   Option C: Global validation in buildSchema options (future)');

  console.log('\n4. Example Usage:');
  console.log(`
  @InputType()
  class CreateUserInput {
    @Field()
    @IsEmail()  // from class-validator
    email!: string;

    @Field()
    @MinLength(8)  // from class-validator
    password!: string;
  }

  @Resolver()
  class UserResolver {
    @UseMiddleware(validationMiddleware)
    @Mutation(() => User)
    async createUser(@Arg('data') data: CreateUserInput) {
      // data is validated before reaching here
      return prisma.user.create({ data });
    }
  }
  `);

  console.log('\n5. Error Handling:');
  console.log('   - ValidationFailedError is thrown on validation failure');
  console.log('   - Contains detailed error information per field');
  console.log('   - GraphQL will return these as user-friendly errors');

  console.log('\n6. Type Safety:');
  console.log('   - Validation decorators don\'t affect TypeScript types');
  console.log('   - TypeScript types come from @Field() decorators');
  console.log('   - Runtime validation complements compile-time type safety');

  console.log('\n' + '='.repeat(60));
  console.log('STATUS:');
  console.log('='.repeat(60));
  console.log(`class-validator installed: ${isValidationEnabled() ? '✅ YES' : '❌ NO'}`);
  console.log(`Validation available: ${isValidationEnabled() ? '✅ YES' : '⚠️  Install class-validator to enable'}`);
  console.log('\nTo enable validation:');
  console.log('  npm install class-validator');
}

main().catch(console.error);
