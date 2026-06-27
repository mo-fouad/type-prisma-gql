function generateInputTypes(model, dmmf) {
  const imports = new Set();
  imports.add("InputType");
  imports.add("Field");

  const createFields = [];
  const updateFields = [];
  const enumImports = new Set();

  for (const field of model.fields) {
    // Skip id and auto-generated fields in create input
    // Skip relation fields
    if (field.kind === "object" || field.isGenerated) {
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
            fieldType = "any";
            break;
          default:
            fieldType = "string";
        }
      }
    }

    const isNullable = !field.isRequired || field.hasDefaultValue;
    const isList = field.isList;

    let decorator = "@Field(";

    // Always add explicit type function for all fields (matching object type generation)
    const graphQLType = graphQLTypeOverride
      ? graphQLTypeOverride
      : field.type === "DateTime"
        ? "Date"
        : field.type === "Json"
          ? "String"
          : field.kind === "enum"
            ? field.type
            : field.type === "String"
              ? "String"
              : field.type === "Boolean"
                ? "Boolean"
                : field.type === "Float"
                  ? "Number"
                  : fieldType;

    if (isList) {
      decorator += `() => [${graphQLType}]`;
    } else {
      decorator += `() => ${graphQLType}`;
    }

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

    const tsType = isList
      ? (isNullable ? `${fieldType}[] | undefined` : `${fieldType}[]`)
      : (isNullable ? `${fieldType} | undefined` : fieldType);

    // Add to create input if not id
    if (field.name !== "id") {
      createFields.push(`  ${decorator}\n  ${field.name}!: ${tsType};`);
    }

    // Add all fields to update input (all optional)
    // For UpdateInput, all fields need explicit type functions and nullable: true
    const updateGraphQLType = graphQLTypeOverride
      ? graphQLTypeOverride
      : field.type === "DateTime"
        ? "Date"
        : field.type === "Json"
          ? "String"
          : field.kind === "enum"
            ? field.type
            : field.type === "String"
              ? "String"
              : field.type === "Boolean"
                ? "Boolean"
                : fieldType;

    let updateDecorator;
    if (decorator.includes("nullable")) {
      // Already has nullable
      updateDecorator = decorator;
    } else {
      // Add explicit type function and nullable
      if (isList) {
        updateDecorator = `@Field(() => [${updateGraphQLType}], { nullable: true })`;
      } else {
        updateDecorator = `@Field(() => ${updateGraphQLType}, { nullable: true })`;
      }
    }

    const updateTsType = isList ? `${fieldType}[] | undefined` : `${fieldType} | undefined`;
    updateFields.push(`  ${updateDecorator}\n  ${field.name}?: ${updateTsType};`);
  }

  const importsStr = `import { ${Array.from(imports).join(", ")} } from 'type-prisma-gql';\n`;

  // Import Prisma and enums from @prisma/client
  const prismaImports = ['Prisma'];
  if (enumImports.size > 0) {
    prismaImports.push(...Array.from(enumImports));
  }
  const prismaImportStr = `import { ${prismaImports.join(", ")} } from '@prisma/client';\n`;

  const createHeader = `/**
 * Generated TypeGraphQL InputType for creating ${model.name}
 *
 * Uses Prisma.${model.name}UncheckedCreateInput for type safety.
 * This allows direct foreign key assignment without nested relation objects.
 * TypeScript will validate this matches your Prisma schema.
 */
`;

  const updateHeader = `/**
 * Generated TypeGraphQL InputType for updating ${model.name}
 *
 * Uses Prisma.${model.name}UncheckedUpdateInput for type safety.
 * All fields are optional for partial updates.
 * This allows direct foreign key assignment without nested relation objects.
 */
`;

  const createInput = `${createHeader}${importsStr}${prismaImportStr}
@InputType()
export class ${model.name}CreateInput implements Prisma.${model.name}UncheckedCreateInput {
${createFields.join("\n\n")}
}
`;

  const updateInput = `${updateHeader}
@InputType()
export class ${model.name}UpdateInput implements Prisma.${model.name}UncheckedUpdateInput {
${updateFields.join("\n\n")}
}
`;

  // Find the primary key field(s) - handle both single and composite keys
  const primaryKeyFields = model.fields.filter(f => f.isId);
  const hasCompositePrimaryKey = model.primaryKey && model.primaryKey.fields && model.primaryKey.fields.length > 1;

  let actualPrimaryKeyFields = primaryKeyFields;
  if (hasCompositePrimaryKey && primaryKeyFields.length === 0) {
    // Get fields from composite key definition
    actualPrimaryKeyFields = model.fields.filter(f =>
      model.primaryKey.fields.includes(f.name)
    );
  }

  // If no primary key, check for unique constraints
  if (actualPrimaryKeyFields.length === 0) {
    const uniqueIndexes = model.uniqueIndexes || [];
    const compoundUnique = uniqueIndexes.find(idx => idx.fields && idx.fields.length > 1);
    if (compoundUnique) {
      actualPrimaryKeyFields = model.fields.filter(f =>
        compoundUnique.fields.includes(f.name)
      );
    } else {
      // Fallback to single unique field
      actualPrimaryKeyFields = model.fields.filter(f => f.isUnique);
    }
  }

  // Generate WherePrimaryInput - all primary key fields (required)
  let wherePrimaryInput = "";
  if (actualPrimaryKeyFields.length > 0) {
    const wherePrimaryHeader = `/**
 * Generated TypeGraphQL InputType for ${model.name} primary key lookup
 */
`;

    const pkFields = actualPrimaryKeyFields.map(field => {
      const pkType = field.type;
      const pkGraphQLType = field.isId && (pkType === "String" || pkType === "Int")
        ? "GraphQLID"
        : pkType === "String"
          ? "String"
          : pkType === "Int"
            ? "GraphQLInt"
            : "String";
      const pkTsType = pkType === "String" ? "string" : pkType === "Int" ? "number" : "string";

      return `  @Field(() => ${pkGraphQLType})\n  ${field.name}!: ${pkTsType};`;
    });

    wherePrimaryInput = `${wherePrimaryHeader}
@InputType()
export class ${model.name}WherePrimaryInput {
${pkFields.join("\n\n")}
}
`;
  }

  // Generate OrderByPrimaryInput - order by primary key fields
  let orderByPrimaryInput = "";
  if (actualPrimaryKeyFields.length > 0) {
    const orderByPrimaryHeader = `/**
 * Generated TypeGraphQL InputType for ordering by ${model.name} primary key
 */
`;

    const orderByFields = actualPrimaryKeyFields.map(field =>
      `  @Field(() => String)\n  ${field.name}!: 'asc' | 'desc';`
    );

    orderByPrimaryInput = `${orderByPrimaryHeader}
@InputType()
export class ${model.name}OrderByPrimaryInput {
${orderByFields.join("\n\n")}
}
`;
  }

  // Generate OrderByDateInput - order by date fields only
  const dateFields = model.fields.filter(f => f.type === "DateTime" && f.kind !== "object");
  let orderByDateInput = "";

  if (dateFields.length > 0) {
    const dateOrderFields = dateFields.map(
      f => `  @Field(() => String)\n  ${f.name}!: 'asc' | 'desc';`,
    );

    const orderByDateHeader = `/**
 * Generated TypeGraphQL InputType for ordering by ${model.name} date fields
 */
`;

    orderByDateInput = `${orderByDateHeader}
@InputType()
export class ${model.name}OrderByDateInput {
${dateOrderFields.join("\n\n")}
}
`;
  }

  return { createInput, updateInput, wherePrimaryInput, orderByPrimaryInput, orderByDateInput };
}


module.exports.default = generateInputTypes;
