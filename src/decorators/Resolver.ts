import { getMetadataStorage } from "../metadata/storage";

export function Resolver(typeFunc?: () => Function): ClassDecorator {
  return (target) => {
    getMetadataStorage().collectResolverClassMetadata({
      target,
      objectType: typeFunc ? typeFunc() : undefined,
    });
  };
}
