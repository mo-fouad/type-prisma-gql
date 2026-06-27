#!/usr/bin/env node

const { generatorHandler } = require('@prisma/generator-helper');
const { generateObjectTypes, generateInputTypes, generateResolvers, generateFieldResolvers, generateEnum } = require('./type-generators');
const fs = require('fs');
const path = require('path');

generatorHandler({
  onManifest() {
    return {
      defaultOutput: './generated',
      prettyName: 'TypeGraphQL Types Generator',
      requiresGenerators: ['prisma-client-js'],
    };
  },

  async onGenerate(options) {
    const output = options.generator.output?.value || './generated';
    const dmmf = options.dmmf;

    // Create directory structure
    const modelsDir = path.join(output, 'Models');
    const resolversDir = path.join(output, 'Resolvers');
    const enumsDir = path.join(output, 'Enums');

    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true });
    }
    if (!fs.existsSync(resolversDir)) {
      fs.mkdirSync(resolversDir, { recursive: true });
    }
    if (!fs.existsSync(enumsDir)) {
      fs.mkdirSync(enumsDir, { recursive: true });
    }

    console.log('📦 Generating TypeGraphQL types...');

    const allModels = [];
    const allResolvers = [];
    const allFieldResolvers = [];
    const allEnums = [];

    // Generate enums first
    for (const enumDef of dmmf.datamodel.enums) {
      const enumCode = generateEnum(enumDef);
      const enumFilePath = path.join(enumsDir, `${enumDef.name}.ts`);
      fs.writeFileSync(enumFilePath, enumCode);
      console.log(`  ✓ Generated Enums/${enumDef.name}.ts`);
      allEnums.push(enumDef.name);
    }

    // Generate for each model
    for (const model of dmmf.datamodel.models) {
      const modelName = model.name;

      // 1. Generate Model in Models/ModelName.ts
      const modelCode = generateObjectTypes(model, dmmf);
      const modelFilePath = path.join(modelsDir, `${modelName}.ts`);
      fs.writeFileSync(modelFilePath, modelCode);
      console.log(`  ✓ Generated Models/${modelName}.ts`);
      allModels.push(modelName);

      // 2. Create Resolvers/ModelName directory
      const modelResolverDir = path.join(resolversDir, modelName);
      if (!fs.existsSync(modelResolverDir)) {
        fs.mkdirSync(modelResolverDir, { recursive: true });
      }

      // 3. Generate ModelInputs.ts
      const { createInput, updateInput, wherePrimaryInput, orderByPrimaryInput, orderByDateInput } =
        generateInputTypes(model, dmmf);

      // Combine all input types, filtering out empty ones
      const inputParts = [createInput, updateInput];
      if (wherePrimaryInput) inputParts.push(wherePrimaryInput);
      if (orderByPrimaryInput) inputParts.push(orderByPrimaryInput);
      if (orderByDateInput) inputParts.push(orderByDateInput);

      const inputsCode = inputParts.join("\n\n");
      const inputsFilePath = path.join(modelResolverDir, `${modelName}Inputs.ts`);
      fs.writeFileSync(inputsFilePath, inputsCode);
      console.log(`  ✓ Generated Resolvers/${modelName}/${modelName}Inputs.ts`);

      // 4. Generate ModelResolver.ts
      const hasDateFields = !!orderByDateInput;
      const resolverCode = generateResolvers(model, dmmf, hasDateFields);
      const resolverFilePath = path.join(modelResolverDir, `${modelName}Resolver.ts`);
      fs.writeFileSync(resolverFilePath, resolverCode);
      console.log(`  ✓ Generated Resolvers/${modelName}/${modelName}Resolver.ts`);
      allResolvers.push(modelName);

      // 5. Generate ModelRelation.ts (FieldResolver)
      const fieldResolverCode = generateFieldResolvers(model, dmmf);
      if (fieldResolverCode) {
        const fieldResolverFilePath = path.join(modelResolverDir, `${modelName}Relation.ts`);
        fs.writeFileSync(fieldResolverFilePath, fieldResolverCode);
        console.log(`  ✓ Generated Resolvers/${modelName}/${modelName}Relation.ts`);
        allFieldResolvers.push(modelName);
      }

      // 6. Generate index.ts in Resolvers/ModelName folder
      const modelIndexExports = [];
      modelIndexExports.push(`export * from './${modelName}Resolver';`);


       modelIndexExports.push(`export * from './${modelName}Inputs';`);

      if (fieldResolverCode) {
        modelIndexExports.push(`export * from './${modelName}Relation';`);
      }

      const modelIndexPath = path.join(modelResolverDir, 'index.ts');
      fs.writeFileSync(modelIndexPath, modelIndexExports.join('\n') + '\n');
      console.log(`  ✓ Generated Resolvers/${modelName}/index.ts`);
    }

    // Generate index files
    generateIndexFiles(output, allModels, allResolvers, allEnums);

    console.log('✅ Generation complete!');
  },
});

function generateIndexFiles(output, models, resolvers, enums) {
  // 1. Enums/index.ts
  if (enums.length > 0) {
    const enumsIndex = enums.map(e => `export * from './${e}';`).join('\n') + '\n';
    fs.writeFileSync(path.join(output, 'Enums', 'index.ts'), enumsIndex);
    console.log('  ✓ Generated Enums/index.ts');
  }

  // 2. Models/index.ts
  const modelsIndex = models.map(m => `export { ${m} } from './${m}';`).join('\n') + '\n';
  fs.writeFileSync(path.join(output, 'Models', 'index.ts'), modelsIndex);
  console.log('  ✓ Generated Models/index.ts');

  // 3. Resolvers/index.ts - exports from model folders
  const resolversExports = resolvers.map(modelName => `export * from './${modelName}';`);
  fs.writeFileSync(path.join(output, 'Resolvers', 'index.ts'), resolversExports.join('\n') + '\n');
  console.log('  ✓ Generated Resolvers/index.ts');

  // 4. Main index.ts - re-exports everything
  const mainIndexParts = [];
  if (enums.length > 0) {
    mainIndexParts.push(`export * from './Enums';`);
  }
  mainIndexParts.push(`export * from './Models';`);
  mainIndexParts.push(`export * from './Resolvers';`);

  const mainIndex = mainIndexParts.join('\n') + '\n';
  fs.writeFileSync(path.join(output, 'index.ts'), mainIndex);
  console.log('  ✓ Generated index.ts');
}
