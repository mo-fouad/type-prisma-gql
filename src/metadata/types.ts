// Simple metadata type definitions

import type { EnumValuesConfig } from "../decorators/types";

export type TypeValueThunk = (type?: void) => Function | object | symbol;
export type ReturnTypeFunc = (returns?: void) => Function | object;

export interface TypeOptions {
  nullable?: boolean | "items" | "itemsAndList";
  array?: boolean;
}

export interface FieldMetadata {
  target: Function;
  name: string;
  getType: TypeValueThunk;
  typeOptions: TypeOptions;
  description?: string;
}

export interface ResolverMetadata {
  target: Function;
  methodName: string;
  schemaName: string;
  getReturnType: TypeValueThunk;
  returnTypeOptions: TypeOptions;
  description?: string;
  params?: ParamMetadata[];
}

export interface ParamMetadata {
  target: Function;
  methodName: string;
  index: number;
  kind: "arg" | "args" | "ctx" | "root" | "info";
  name?: string;  // For @Arg
  getType?: TypeValueThunk;
  typeOptions?: TypeOptions;
}

export interface ObjectClassMetadata {
  target: Function;
  name: string;
  description?: string;
}

export interface InputClassMetadata {
  target: Function;
  name: string;
  description?: string;
}

export interface ResolverClassMetadata {
  target: Function;
  objectType?: Function;  // The object type this resolver is for (used for field resolvers)
}

export interface AuthMetadata {
  target: Function;
  methodName: string;
  roles?: string[];
}

export interface MiddlewareMetadata {
  target: Function;
  methodName: string;
  middleware: MiddlewareFunction[];
}

export interface EnumMetadata {
  enumObj: object;
  name: string;
  description: string | undefined;
  valuesConfig: EnumValuesConfig<any>;
}


export type MiddlewareFunction = (
  context: { args: any; context: any; info: any; root?: any },
  next: () => Promise<any>
) => Promise<any>;

export type SubscribeFn = (root: any, args: any, ctx: any, info: any) => AsyncIterable<any> | Promise<AsyncIterable<any>>;
export type FilterFn = (payload: any, args: any, ctx: any) => boolean | Promise<boolean>;

export interface SubscriptionMetadata extends ResolverMetadata {
  subscribeFn: SubscribeFn;
  filterFn?: FilterFn;
}
