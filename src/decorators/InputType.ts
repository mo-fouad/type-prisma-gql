import { getMetadataStorage } from "../metadata/storage";

export interface InputTypeOptions {
  description?: string;
}

export function InputType(name?: string, options?: InputTypeOptions): ClassDecorator;
export function InputType(options?: InputTypeOptions): ClassDecorator;
export function InputType(
  nameOrOptions?: string | InputTypeOptions,
  maybeOptions?: InputTypeOptions,
): ClassDecorator {
  let name: string | undefined;
  let options: InputTypeOptions = {};

  if (typeof nameOrOptions === "string") {
    name = nameOrOptions;
    options = maybeOptions || {};
  } else if (nameOrOptions) {
    options = nameOrOptions;
  }

  return (target) => {
    getMetadataStorage().collectInputMetadata({
      target,
      name: name || target.name,
      description: options.description,
    });
  };
}
