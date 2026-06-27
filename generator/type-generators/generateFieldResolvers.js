/**
 * Generates field resolvers for Prisma model relations
 *
 * Nullability rules:
 * - List relations (one-to-many): Always return array, never null
 * - Required singular relations: Use findUniqueOrThrow, never null
 * - Optional singular relations: Use findUnique, can return null → { nullable: true }
 */
function generateFieldResolvers(model, dmmf) {
  const modelName = model.name;
  const modelNameLower = modelName[0].toLowerCase() + modelName.slice(1);

  // Find the primary key of the current model
  const currentPrimaryKey = model.fields.find(f => f.isId);
  const currentPkName = currentPrimaryKey ? currentPrimaryKey.name : "id";

  // Find relation fields
  const relationFields = model.fields.filter(f => f.kind === "object");

  if (relationFields.length === 0) {
    return null; // No relations, no field resolver needed
  }

  const imports = new Set(["Resolver", "FieldResolver", "Root", "Ctx"]);
  const fieldResolvers = [];

  for (const field of relationFields) {
    const relatedType = field.type;
    const relatedTypeLower = relatedType[0].toLowerCase() + relatedType.slice(1);
    const isList = field.isList;

    if (isList) {
      // One-to-many: User.posts -> find all Post where authorId = user.id
      const relatedModel = dmmf.datamodel.models.find(m => m.name === relatedType);
      if (relatedModel) {
        const reverseField = relatedModel.fields.find(
          f => f.kind === "object" && f.type === modelName,
        );

        if (
          reverseField &&
          reverseField.relationFromFields &&
          reverseField.relationFromFields.length > 0
        ) {
          const foreignKey = reverseField.relationFromFields[0];

          // List relations always return array, never null
          fieldResolvers.push(`  @FieldResolver(() => [${relatedType}])
  async ${field.name}(
    @Root() ${modelNameLower}: ${modelName},
    @Ctx() { prisma }: Context,
  ) {
    return prisma.${relatedTypeLower}.findMany({
      where: { ${foreignKey}: ${modelNameLower}.${currentPkName} },
    });
  }`);
        }
      }
    } else {
      // Many-to-one: Post.author -> find User where id = post.authorId
      if (field.relationFromFields && field.relationFromFields.length > 0) {
        const foreignKey = field.relationFromFields[0];

        const isRequired = field.isRequired;
        const prismaMethod = isRequired ? "findUniqueOrThrow" : "findUnique";

        // Find the primary key of the related model
        const relatedModel = dmmf.datamodel.models.find(m => m.name === relatedType);
        const relatedPrimaryKey = relatedModel ? relatedModel.fields.find(f => f.isId) : null;
        const relatedPkName = relatedPrimaryKey ? relatedPrimaryKey.name : "id";

        // Only optional relations can return null
        fieldResolvers.push(`  @FieldResolver(() => ${relatedType}${isRequired ? "" : ", { nullable: true }"})
  async ${field.name}(
    @Root() ${modelNameLower}: ${modelName},
    @Ctx() { prisma }: Context,
  ) {
    return prisma.${relatedTypeLower}.${prismaMethod}({
      where: { ${relatedPkName}: ${modelNameLower}.${foreignKey} },
    });
  }`);
      }
    }
  }

  if (fieldResolvers.length === 0) {
    return null;
  }

  const importsStr = `import { ${Array.from(imports).join(", ")} } from 'type-prisma-gql';\n`;
  const typeImports = `import { ${modelName} } from '../../Models/${modelName}';\n`;
  const relatedTypes = [...new Set(relationFields.map(f => f.type))];
  const relatedTypeImports =
    relatedTypes.map(type => `import { ${type} } from '../../Models/${type}';`).join("\n") + "\n";
  const prismaImport = `import { PrismaClient } from '@prisma/client';\n`;

  const header = `/**
 * Generated Field Resolvers for ${modelName} relations
 *
 * These resolvers fetch related data using Prisma Client.
 * They are automatically called when relation fields are queried in GraphQL.
 */
`;

  return `${header}${importsStr}${typeImports}${relatedTypeImports}${prismaImport}
interface Context {
  prisma: PrismaClient;
}

@Resolver(() => ${modelName})
export class ${modelName}FieldResolver {
${fieldResolvers.join("\n\n")}
}
`;
}


module.exports.default = generateFieldResolvers;
