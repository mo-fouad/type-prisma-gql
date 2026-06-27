import { getMetadataStorage } from "../metadata/storage";

export interface ObjectTypeOptions {
  description?: string;
}

export function ObjectType(name?: string, options?: ObjectTypeOptions): ClassDecorator;
export function ObjectType(options?: ObjectTypeOptions): ClassDecorator;
export function ObjectType(
  nameOrOptions?: string | ObjectTypeOptions,
  maybeOptions?: ObjectTypeOptions,
): ClassDecorator {
  let name: string | undefined;
  let options: ObjectTypeOptions = {};

  if (typeof nameOrOptions === "string") {
    name = nameOrOptions;
    options = maybeOptions || {};
  } else if (nameOrOptions) {
    options = nameOrOptions;
  }

  return (target) => {
    getMetadataStorage().collectObjectMetadata({
      target,
      name: name || target.name,
      description: options.description,
    });
  };
}
