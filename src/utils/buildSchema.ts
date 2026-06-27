import { type GraphQLSchema } from "graphql";
import { SchemaGenerator, type SchemaOptions } from "../schema/generator";

export async function buildSchema(options: SchemaOptions): Promise<GraphQLSchema> {
  // Clear previous schema
  SchemaGenerator.clear();

  // Generate schema
  return SchemaGenerator.generate(options);
}
