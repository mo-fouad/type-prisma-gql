import { getMetadataStorage } from "../metadata/storage";

export function Ctx(): ParameterDecorator {
  return (prototype: Object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    if (!propertyKey || typeof propertyKey === "symbol") {
      throw new Error("Symbol keys are not supported");
    }

    getMetadataStorage().collectParamMetadata({
      target: prototype.constructor,
      methodName: propertyKey,
      index: parameterIndex,
      kind: "ctx",
    });
  };
}
