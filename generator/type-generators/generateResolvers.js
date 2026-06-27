/**
 * Generates CRUD resolvers for a Prisma model
 *
 * Nullability rules:
 * - Query return types: findUnique → nullable (can return null), findMany → NOT nullable (returns array)
 * - Arguments: Optional filters (where, orderBy, skip, take) → nullable
 * - Mutation return types: NEVER nullable (create/update/delete always return the record)
 */
function generateResolvers(model, dmmf, hasDateFields = false) {
  const modelName = model.name;
  const modelNameLower = modelName[0].toLowerCase() + modelName.slice(1);

  // Find the primary key field(s) - handle both single and composite keys
  const primaryKeyFields = model.fields.filter(f => f.isId);
  const hasCompositePrimaryKey = model.primaryKey && model.primaryKey.fields && model.primaryKey.fields.length > 1;

  let actualPrimaryKeyFields = primaryKeyFields;
  let keyFieldNames = [];

  if (hasCompositePrimaryKey && primaryKeyFields.length === 0) {
    keyFieldNames = model.primaryKey.fields;
    actualPrimaryKeyFields = keyFieldNames.map(name =>
      model.fields.find(f => f.name === name)
    ).filter(Boolean);
  }

  // If no primary key, check for unique constraints
  if (actualPrimaryKeyFields.length === 0) {
    const uniqueIndexes = model.uniqueIndexes || [];
    const compoundUnique = uniqueIndexes.find(idx => idx.fields && idx.fields.length > 1);
    if (compoundUnique) {
      keyFieldNames = compoundUnique.fields;
      actualPrimaryKeyFields = keyFieldNames.map(name =>
        model.fields.find(f => f.name === name)
      ).filter(Boolean);
    } else {
      actualPrimaryKeyFields = model.fields.filter(f => f.isUnique);
      if (actualPrimaryKeyFields.length === 0) {
        actualPrimaryKeyFields = [model.fields[0]];
      }
    }
  }

  // Determine orderBy input type
  const orderByInputType = hasDateFields ? `${modelName}OrderByDateInput` : `${modelName}OrderByPrimaryInput`;
  const orderByImport = hasDateFields ? `, ${modelName}OrderByDateInput` : `, ${modelName}OrderByPrimaryInput`;

  // Build primary key arguments for resolver methods
  const pkArgs = actualPrimaryKeyFields.map(field => {
    const pkType = field.type;
    const pkGraphQLType = pkType === "String" ? "String" : "GraphQLInt";
    const pkTsType = pkType === "String" ? "string" : "number";
    return {
      name: field.name,
      graphQLType: pkGraphQLType,
      tsType: pkTsType
    };
  });

  // @Arg requires explicit type function (no reflect-metadata)
  const pkArgsList = pkArgs.map(pk => `@Arg('${pk.name}', () => ${pk.graphQLType}) ${pk.name}: ${pk.tsType}`).join(', ');

  // For composite keys, Prisma uses compound key format: { fieldA_fieldB: { fieldA, fieldB } }
  let pkWhereClause;
  if (actualPrimaryKeyFields.length === 1) {
    pkWhereClause = `{ ${pkArgs[0].name} }`;
  } else {
    const compoundKeyName = pkArgs.map(pk => pk.name).join('_');
    const compoundKeyFields = pkArgs.map(pk => pk.name).join(', ');
    pkWhereClause = `{ ${compoundKeyName}: { ${compoundKeyFields} } }`;
  }

  return `import { PrismaClient } from '@prisma/client';
import { Resolver, Query, Mutation, Arg, Ctx, GraphQLInt } from 'type-prisma-gql';
import { ${modelName} } from '../../Models';
import { ${modelName}CreateInput, ${modelName}UpdateInput, ${modelName}WherePrimaryInput${orderByImport} } from './${modelName}Inputs';

interface Context {
  prisma: PrismaClient;
}

@Resolver()
export class ${modelName}Resolver {
  // Find many - returns array (never null), all filter args are optional
  @Query(() => [${modelName}])
  async ${modelNameLower}s(
    @Arg('where', () => ${modelName}WherePrimaryInput, { nullable: true }) where: ${modelName}WherePrimaryInput | undefined,
    @Arg('orderBy', () => ${orderByInputType}, { nullable: true }) orderBy: ${orderByInputType} | undefined,
    @Arg('skip', () => GraphQLInt, { nullable: true }) skip: number | undefined,
    @Arg('take', () => GraphQLInt, { nullable: true }) take: number | undefined,
    @Ctx() { prisma }: Context,
  ): Promise<${modelName}[]> {
    return prisma.${modelNameLower}.findMany({
      where: where || undefined,
      orderBy: orderBy || undefined,
      skip: skip || undefined,
      take: take || undefined,
    });
  }

  // Find unique - can return null if not found
  @Query(() => ${modelName}, { nullable: true })
  async ${modelNameLower}(
    ${pkArgsList},
    @Ctx() { prisma }: Context,
  ): Promise<${modelName} | null> {
    return prisma.${modelNameLower}.findUnique({ where: ${pkWhereClause} });
  }

  // Create - always returns the created record
  @Mutation(() => ${modelName})
  async create${modelName}(
    @Arg('data', () => ${modelName}CreateInput) data: ${modelName}CreateInput,
    @Ctx() { prisma }: Context,
  ): Promise<${modelName}> {
    return prisma.${modelNameLower}.create({ data });
  }

  // Update - always returns the updated record
  @Mutation(() => ${modelName})
  async update${modelName}(
    ${pkArgsList},
    @Arg('data', () => ${modelName}UpdateInput) data: ${modelName}UpdateInput,
    @Ctx() { prisma }: Context,
  ): Promise<${modelName}> {
    return prisma.${modelNameLower}.update({ where: ${pkWhereClause}, data });
  }

  // Delete - always returns the deleted record
  @Mutation(() => ${modelName})
  async delete${modelName}(
    ${pkArgsList},
    @Ctx() { prisma }: Context,
  ): Promise<${modelName}> {
    return prisma.${modelNameLower}.delete({ where: ${pkWhereClause} });
  }
}
`;
}

module.exports.default = generateResolvers;
