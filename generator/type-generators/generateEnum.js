function generateEnum(enumDef) {
  const { name } = enumDef;

  const header = `/**
 * Generated GraphQL enum from Prisma enum: ${name}
 */
`;

  return `${header}import { registerEnumType } from 'type-prisma-gql';
import { ${name} } from '@prisma/client';

registerEnumType(${name}, {
  name: '${name}',
  description: 'Generated from Prisma enum ${name}',
});

export { ${name} };
`;
}

module.exports.default = generateEnum;
