
export interface DescriptionOptions {
  description?: string;
}
export interface DeprecationOptions {
  deprecationReason?: string;
}

export interface EnumConfig<TEnum extends object> {
  name: string;
  description?: string;
  valuesConfig?: EnumValuesConfig<TEnum>;
}
export type EnumValuesConfig<TEnum extends object> = Partial<
  Record<keyof TEnum, DescriptionOptions & DeprecationOptions>
>;
