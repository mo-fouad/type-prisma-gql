function generateObjectTypes(model, dmmf) {
  const imports = new Set();
  imports.add("ObjectType");
  imports.add("Field");

  const fields = [];
  const relationImports = new Set();
  const enumImports = new Set();
  let needsGraphQLScalars = false;
  let needsPrismaNamespace = false;

  for (const field of model.fields) {
    // Handle relation fields with lazy type resolution
    if (field.kind === "object") {
      relationImports.add(field.type);
      const isNullable = !field.isRequired;
      const isList = field.isList;

      let decorator = "@Field(() => ";
      decorator += isList ? `[${field.type}]` : field.type;

      const options = [];
      if (isNullable) {
        options.push("nullable: true");
      }

      if (options.length > 0) {
        decorator += `, { ${options.join(", ")} })`;
      } else {
        decorator += ")";
      }

      const tsType = isList ? `${field.type}[]` : isNullable ? `${field.type} | null` : field.type;

      // Relation fields are optional since they're resolved by field resolvers
      fields.push(`  ${decorator}\n  ${field.name}?: ${tsType};`);
      continue;
    }

    let fieldType;
    let graphQLTypeOverride = null;

    // Check if field is an enum
    if (field.kind === "enum") {
      fieldType = field.type;
      enumImports.add(field.type);
    } else {
      // Handle @id fields with GraphQL ID type
      if (field.isId && (field.type === "String" || field.type === "Int")) {
        fieldType = field.type === "String" ? "string" : "number";
        graphQLTypeOverride = "GraphQLID";
        imports.add("GraphQLID");
      } else {
        switch (field.type) {
          case "String":
            fieldType = "string";
            break;
          case "Int":
            fieldType = "number";
            imports.add("GraphQLInt");
            graphQLTypeOverride = "GraphQLInt";
            break;
          case "Float":
            fieldType = "number";
            break;
          case "Boolean":
            fieldType = "boolean";
            break;
          case "DateTime":
            fieldType = "Date";
            break;
          case "Json":
            fieldType = "Prisma.JsonValue";
            needsPrismaNamespace = true;
            break;
          default:
            fieldType = "string";
        }
      }
    }

    const isNullable = !field.isRequired;
    const isList = field.isList;

    let decorator = "@Field(";

    // Always add explicit type function for clarity
    let graphQLType;
    if (graphQLTypeOverride) {
      graphQLType = graphQLTypeOverride;
    } else if (field.type === "Json") {
      graphQLType = "GraphQLScalars.JSONResolver";
      needsGraphQLScalars = true;
    } else if (field.type === "DateTime") {
      graphQLType = "Date";
    } else if (field.kind === "enum") {
      graphQLType = field.type;
    } else if (field.type === "String") {
      graphQLType = "String";
    } else if (field.type === "Boolean") {
      graphQLType = "Boolean";
    } else if (field.type === "Float") {
      graphQLType = "Number";
    } else {
      graphQLType = fieldType;
    }

    if (isList) {
      decorator += `() => [${graphQLType}]`;
    } else {
      decorator += `() => ${graphQLType}`;
    }

    // Add options
    const options = [];
    if (isNullable) {
      options.push("nullable: true");
    }

    if (options.length > 0) {
      if (decorator.endsWith("(")) {
        decorator += `{ ${options.join(", ")} }`;
      } else {
        decorator += `, { ${options.join(", ")} }`;
      }
    }

    decorator += ")";

    const tsType = isList ? `${fieldType}[]` : isNullable ? `${fieldType} | null` : fieldType;

    fields.push(`  ${decorator}\n  ${field.name}!: ${tsType};`);
  }

  let importsStr = `import { ${Array.from(imports).join(", ")} } from 'type-prisma-gql';\n`;

  // Import the model type and enums from @prisma/client
  const prismaImports = [model.name];
  if (enumImports.size > 0) {
    prismaImports.push(...Array.from(enumImports));
  }
  if (needsPrismaNamespace) {
    prismaImports.push("Prisma");
  }
  importsStr += `import { ${prismaImports.map((imp, i) => i === 0 ? `${imp} as Prisma${imp}` : imp).join(", ")} } from '@prisma/client';\n`;

  if (needsGraphQLScalars) {
    importsStr += `import * as GraphQLScalars from 'graphql-scalars';\n`;
  }

  if (relationImports.size > 0) {
    importsStr += `import { ${Array.from(relationImports).join(", ")} } from '../Models';\n`;
  }

  const header = `/**
 * Generated TypeGraphQL ObjectType from Prisma model: ${model.name}
 *
 * This class implements the Prisma ${model.name} interface, ensuring type safety
 * and automatic validation against your Prisma schema.
 */
`;

  return `${header}${importsStr}
@ObjectType()
export class ${model.name} implements Prisma${model.name} {
${fields.join("\n\n")}
}
`;
}

module.exports.default = generateObjectTypes;
