import { getMetadataStorage } from "../metadata/storage";
import { InputType } from "../decorators/InputType";
import { ObjectType } from "../decorators/ObjectType";
import type { FieldMetadata } from "../metadata/types";

// Utility types for TypeScript
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export type ClassType<T = any> = new (...args: any[]) => T;

/**
 * Type kind for utility functions - determines whether the generated type
 * will be an ObjectType or InputType in GraphQL schema.
 */
export type TypeKind = 'object' | 'input';

/**
 * Selection type - supports nested relation selection or class references
 *
 * @example
 * ```typescript
 * // Inline selection
 * Pick(User, { id: true, profile: { roleId: true } })
 *
 * // Optional field - will be nullable in GraphQL and optional in TypeScript
 * Pick(User, { id: true, email: 'optional' })
 *
 * // Class reference for nested type (recommended for stable naming)
 * @ObjectType()
 * class ProfilePick extends Pick(Profile, { roleId: true }) {}
 * Pick(User, { id: true, profile: ProfilePick })
 * ```
 */
export type Selection<T> = {
  [K in keyof T]?: true | 'optional' | ClassType | Record<string, any>;
};

/**
 * Helper type to extract the TypeScript type of picked fields
 * Handles 'optional' fields by making them truly optional with `?`
 */
export type PickedType<T, S extends Selection<T>> =
  // Required fields (true, ClassType, or nested selection)
  {
    [K in keyof S & keyof T as S[K] extends 'optional' ? never : K]:
      S[K] extends new (...args: any[]) => infer R
        ? R  // If S[K] is a class constructor, use its instance type
        : S[K] extends Record<string, any>
          ? T[K] extends (infer U)[]
            ? PickedType<U, S[K]>[]  // Handle array relations
            : T[K] extends object
              ? PickedType<T[K], S[K]>  // Handle nested objects
              : T[K]
          : T[K]  // Simple field (true)
  }
  // Optional fields ('optional')
  & {
    [K in keyof S & keyof T as S[K] extends 'optional' ? K : never]?: T[K]
  };

/**
 * Helper type to extract the TypeScript type after omitting fields
 */
export type OmittedType<T, S extends Partial<Record<keyof T, true | Record<string, any>>>> = {
  [K in Exclude<keyof T, keyof S>]: T[K]
};

/**
 * Helper type to make fields optional
 */
export type PartialType<T, S extends Partial<Record<keyof T, true | Record<string, any>>> | null> =
  S extends null
    ? { [K in keyof T]?: T[K] }
    : { [K in keyof T]: K extends keyof S ? (T[K] | undefined) : T[K] };

/**
 * Helper type to make fields required
 */
export type RequiredType<T, S extends Partial<Record<keyof T, true>> | null> =
  S extends null
    ? { [K in keyof T]-?: T[K] }
    : { [K in keyof T]: K extends keyof S ? NonNullable<T[K]> : T[K] };

// Counter for unique class names
let classCounter = 0;

/**
 * Internal function to build a new type based on an existing type
 */
function buildType(
  BaseClass: ClassType,
  buildFn: (f: FieldMetadata, parentClassName?: string) => FieldMetadata | FieldMetadata[] | undefined,
  kind: TypeKind = 'object',
  suffix = '',
  parentClassName?: string,
  applyDecorator = false
): any {
  // Create a uniquely named class
  const className = parentClassName
    ? `${parentClassName}${BaseClass.name}${suffix}`
    : `${BaseClass.name}${suffix}${classCounter++}`;

  const ChildClass = {
    [className]: class {}
  }[className];

  if (applyDecorator) {
    if (kind === 'input') {
      InputType()(ChildClass);
    } else {
      ObjectType()(ChildClass);
    }
  }

  const storage = getMetadataStorage();

  const baseFields = storage.fields.filter((f) =>
    f.target === BaseClass || BaseClass.prototype instanceof (f.target as any)
  );

  baseFields.forEach((f) => {
    if (typeof f.getType === 'function') {
      f.getType();
    }

    const transformedField = buildFn(f, className);

    if (Array.isArray(transformedField)) {
      transformedField.forEach((field) =>
        storage.fields.push({ ...field, target: ChildClass })
      );
    } else if (transformedField) {
      storage.fields.push({ ...transformedField, target: ChildClass });
    }
  });

  return ChildClass;
}

/**
 * Creates a new type with only the specified fields from the base type.
 * Supports nested relation selection via inline objects or class references.
 * Use 'optional' to make a field nullable in GraphQL and optional in TypeScript.
 *
 * @example
 * ```typescript
 * @ObjectType()
 * class User {
 *   @Field() id!: number;
 *   @Field() email!: string;
 *   @Field() password!: string;
 *   @Field(() => [Post]) posts!: Post[];
 * }
 *
 * // Use with extends pattern (recommended) - defaults to ObjectType
 * @ObjectType()
 * class UserPublicInfo extends Pick(User, { id: true, email: true }) {}
 *
 * // Optional fields - nullable in GraphQL, optional in TypeScript
 * @ObjectType()
 * class UserWithOptionalEmail extends Pick(User, {
 *   id: true,
 *   email: 'optional'  // email?: string (optional in TS, nullable in GraphQL)
 * }) {}
 *
 * // For InputType, pass 'input' as third parameter
 * @InputType()
 * class UserCreateInput extends Pick(User, { id: true, email: true }, 'input') {}
 *
 * // Nested relations with inline selection (generates auto-named types)
 * @ObjectType()
 * class UserWithPosts extends Pick(User, {
 *   id: true,
 *   posts: { id: true, title: true }
 * }) {}
 *
 * // Nested relations with class reference (recommended for stable naming)
 * @ObjectType()
 * class PostPick extends Pick(Post, { id: true, title: true }) {}
 *
 * @ObjectType()
 * class UserWithPosts extends Pick(User, {
 *   id: true,
 *   posts: PostPick  // Use the class directly!
 * }) {}
 * ```
 */
export function Pick<
  T extends ClassType,
  S extends Selection<InstanceType<T>>
>(
  BaseClass: T,
  selection: S,
  kind: TypeKind = 'object'
): ClassType<PickedType<InstanceType<T>, S>> {
  return buildType(
    BaseClass,
    (f, parentClassName) => {
      const fieldName = f.name as keyof typeof selection;
      const fieldSelection = selection[fieldName];

      // Field not selected
      if (!fieldSelection) {
        return undefined;
      }

      // Simple field selected as required
      if (fieldSelection === true) {
        return f;
      }

      // Simple field selected as optional
      if (fieldSelection === 'optional') {
        return {
          ...f,
          typeOptions: {
            ...f.typeOptions,
            nullable: true,
          },
        };
      }

      // Check if fieldSelection is a class reference (function with prototype)
      // This allows: Pick(User, { profile: ProfilePick }) where ProfilePick is a class
      if (typeof fieldSelection === 'function' && fieldSelection.prototype) {
        return {
          ...f,
          getType: () => fieldSelection,
        };
      }

      // Inline nested selection for relation
      // Get the relation type
      let actualType: any;
      try {
        const resolvedType = f.getType();

        // If it's a function that returns an array, get the element type
        if (Array.isArray(resolvedType)) {
          actualType = resolvedType[0];
        } else {
          actualType = resolvedType;
        }
      } catch {
        // If getType fails, just include the field as-is
        return f;
      }

      // If it's a class (relation), create nested Pick with inline selection
      if (typeof actualType === 'function' && actualType.prototype) {
        try {
          // Use parentClassName for nested types
          const NestedType = buildType(
            actualType as ClassType,
            (nestedF) => {
              const nestedFieldName = nestedF.name as keyof typeof fieldSelection;
              const nestedFieldSelection = (fieldSelection as any)[nestedFieldName];

              if (!nestedFieldSelection) return undefined;
              if (nestedFieldSelection === true) return nestedF;

              // TODO: Handle deeper nesting if needed
              return nestedF;
            },
            kind,
            'Pick',
            parentClassName,
            true  // Nested types always get decorators applied
          );

          // Return modified field metadata with nested type
          // NOTE: Don't wrap in array - typeOptions.array handles that
          return {
            ...f,
            getType: () => NestedType,
          };
        } catch {
          // If nested Pick fails, just include the field as-is
          return f;
        }
      }

      // Fallback: just include the field
      return f;
    },
    kind,
    'Pick'
  );
}

/**
 * Creates a new type with all fields except the specified ones.
 * Supports nested relation omission via inline objects or class references.
 *
 * @example
 * ```typescript
 * @ObjectType()
 * class User {
 *   @Field() id!: number;
 *   @Field() email!: string;
 *   @Field() password!: string;
 *   @Field(() => [Post]) posts!: Post[];
 * }
 *
 * // Use with extends pattern (recommended) - defaults to ObjectType
 * @ObjectType()
 * class UserWithoutPassword extends Omit(User, { password: true }) {}
 *
 * // For InputType, pass 'input' as third parameter
 * @InputType()
 * class UserCreateInput extends Omit(User, { password: true }, 'input') {}
 *
 * // Nested relations with inline omission (generates auto-named types)
 * @ObjectType()
 * class UserWithFilteredPosts extends Omit(User, {
 *   password: true,
 *   posts: { content: true }  // Keep posts, but omit content from Post
 * }) {}
 *
 * // Nested relations with class reference (recommended for stable naming)
 * @ObjectType()
 * class PostWithoutContent extends Omit(Post, { content: true }) {}
 *
 * @ObjectType()
 * class UserWithFilteredPosts extends Omit(User, {
 *   password: true,
 *   posts: PostWithoutContent  // Use the class directly!
 * }) {}
 * ```
 */
export function Omit<
  T extends ClassType,
  S extends Partial<Record<keyof InstanceType<T>, true | ClassType | Record<string, any>>>
>(
  BaseClass: T,
  selection: S,
  kind: TypeKind = 'object'
): ClassType<OmittedType<InstanceType<T>, S>> {
  return buildType(
    BaseClass,
    (f: FieldMetadata, parentClassName?: string) => {
      const fieldName = f.name as keyof typeof selection;
      const fieldSelection = selection[fieldName];

      // Field not in selection - include it
      if (!fieldSelection) {
        return f;
      }

      // Field is marked for complete omission
      if (fieldSelection === true) {
        return undefined;
      }

      // Check if fieldSelection is a class reference (function with prototype)
      // This allows: Omit(User, { posts: PostWithoutContent })
      if (typeof fieldSelection === 'function' && fieldSelection.prototype) {
        return {
          ...f,
          getType: () => fieldSelection,
        };
      }

      // Inline nested omission for relation
      // Get the relation type
      let actualType: any;
      try {
        const resolvedType = f.getType();

        // If it's a function that returns an array, get the element type
        if (Array.isArray(resolvedType)) {
          actualType = resolvedType[0];
        } else {
          actualType = resolvedType;
        }
      } catch {
        // If getType fails, just include the field as-is
        return f;
      }

      // If it's a class (relation), create nested Omit with inline selection
      if (typeof actualType === "function" && actualType.prototype) {
        try {
          const NestedType = buildType(
            actualType as ClassType,
            (nestedF) => {
              const nestedFieldName = nestedF.name as keyof typeof fieldSelection;
              const nestedFieldSelection = (fieldSelection as any)[nestedFieldName];

              if (!nestedFieldSelection) return nestedF;
              if (nestedFieldSelection === true) return undefined;

              return nestedF;
            },
            kind,
            'Omit',
            parentClassName,
            true  // Nested types always get decorators applied
          );

          // Return modified field metadata with nested type
          // NOTE: Don't wrap in array - typeOptions.array handles that
          return {
            ...f,
            getType: () => NestedType,
          };
        } catch {
          // If nested Omit fails, just include the field as-is
          return f;
        }
      }

      // Fallback: just include the field
      return f;
    },
    kind,
    "Omit"
  );
}

/**
 * Creates a new type with all or specified fields made optional.
 * Supports nested relations.
 *
 * @example
 * ```typescript
 * @InputType()
 * class CreateUserInput {
 *   @Field() email!: string;
 *   @Field() password!: string;
 *   @Field() name!: string;
 * }
 *
 * // Use with extends pattern (recommended) - defaults to ObjectType
 * @ObjectType()
 * class PartialUser extends Partial(CreateUserInput) {}
 *
 * // For InputType, pass 'input' as third parameter
 * @InputType()
 * class UpdateUserInput extends Partial(CreateUserInput, null, 'input') {}
 *
 * // Make only specific fields optional
 * @InputType()
 * class UserInputOptional extends Partial(CreateUserInput, {
 *   name: true,
 *   bio: true
 * }, 'input') {}
 *
 * // Partial with nested relations - make fields optional in nested type
 * @ObjectType()
 * class UpdateUserWithPostsInput extends Partial(CreateUserInput, {
 *   name: true,
 *   posts: {
 *     title: true  // Keep posts, but make title optional in Post
 *   }
 * }) {}
 * ```
 */
export function Partial<
  T extends ClassType,
  S extends Partial<Record<keyof InstanceType<T>, true | Record<string, any>>> | null = null
>(
  BaseClass: T,
  selection?: S,
  kind: TypeKind = 'object'
): ClassType<PartialType<InstanceType<T>, S>> {
  return buildType(
    BaseClass,
    (f, parentClassName?: string) => {
      const fieldName = f.name as keyof NonNullable<typeof selection>;
      const fieldSelection = selection?.[fieldName];

      // If no selection, make all optional
      if (!selection) {
        return {
          ...f,
          typeOptions: {
            ...f.typeOptions,
            nullable: true,
          },
        };
      }

      // Field not in selection - keep as-is
      if (!fieldSelection) {
        return f;
      }

      // Simple field - make it optional
      if (fieldSelection === true) {
        return {
          ...f,
          typeOptions: {
            ...f.typeOptions,
            nullable: true,
          },
        };
      }

      // Nested partial for relation
      // Get the relation type
      let actualType: any;
      try {
        const resolvedType = f.getType();

        // If it's a function that returns an array, get the element type
        if (Array.isArray(resolvedType)) {
          actualType = resolvedType[0];
        } else {
          actualType = resolvedType;
        }
      } catch {
        // If getType fails, just include the field as-is
        return f;
      }

      // If it's a class (relation), create nested Partial
      if (typeof actualType === 'function' && actualType.prototype) {
        try {
          const NestedType = buildType(
            actualType as ClassType,
            (nestedF) => {
              const nestedFieldName = nestedF.name as keyof typeof fieldSelection;
              const nestedFieldSelection = (fieldSelection as any)[nestedFieldName];

              if (!nestedFieldSelection) return nestedF;
              if (nestedFieldSelection === true) {
                return {
                  ...nestedF,
                  typeOptions: {
                    ...nestedF.typeOptions,
                    nullable: true,
                  },
                };
              }

              return nestedF;
            },
            kind,
            'Partial',
            parentClassName,
            true  // Nested types always get decorators applied
          );

          // Return modified field metadata with nested type
          // NOTE: Don't wrap in array - typeOptions.array handles that
          return {
            ...f,
            getType: () => NestedType,
          };
        } catch {
          // If nested Partial fails, just include the field as-is
          return f;
        }
      }

      // Fallback: just include the field
      return f;
    },
    kind,
    'Partial'
  );
}

/**
 * Creates a new type with all or specified fields made required.
 *
 * @example
 * ```typescript
 * @InputType()
 * class UserInput {
 *   @Field() email!: string;
 *   @Field({ nullable: true }) name?: string;
 *   @Field({ nullable: true }) bio?: string;
 * }
 *
 * // Use with extends pattern (recommended) - defaults to ObjectType
 * @ObjectType()
 * class RequiredUserOutput extends Required(UserInput) {}
 *
 * // For InputType, pass 'input' as third parameter
 * @InputType()
 * class RequiredUserInput extends Required(UserInput, null, 'input') {}
 *
 * // Make only name required
 * @InputType()
 * class UserInputWithRequiredName extends Required(UserInput, { name: true }, 'input') {}
 * ```
 */
export function Required<
  T extends ClassType,
  S extends Partial<Record<keyof InstanceType<T>, true>> | null = null
>(
  BaseClass: T,
  selection?: S,
  kind: TypeKind = 'object'
): ClassType<RequiredType<InstanceType<T>, S>> {
  return buildType(
    BaseClass,
    (f) => {
      const fieldName = f.name as keyof NonNullable<typeof selection>;

      // If no selection, make all required
      // If selection provided, only make selected fields required
      if (!selection || selection[fieldName] === true) {
        return {
          ...f,
          typeOptions: {
            ...f.typeOptions,
            nullable: false,
          },
        };
      }

      return f;
    },
    kind,
    'Required'
  );
}

/**
 * Builds an enum object from a class's fields
 */
export function buildFieldsEnum<T extends ClassType>(
  Class: T,
  name: string
): Record<keyof InstanceType<T>, keyof InstanceType<T>> {
  const storage = getMetadataStorage();
  const enumObj = {} as Record<keyof InstanceType<T>, keyof InstanceType<T>>;

  storage.fields.forEach((f) => {
    if (f.target !== Class && !(Class.prototype instanceof (f.target as any))) {
      return;
    }

    enumObj[f.name as keyof InstanceType<T>] = f.name as keyof InstanceType<T>;
  });

  return enumObj;
}

/**
 * Combines multiple partial types into one
 *
 * @example
 * ```typescript
 * // Use with extends pattern (recommended) - defaults to ObjectType behavior
 * @ObjectType()
 * class CombinedOutput extends Merge([UserOutput, ProfileOutput]) {}
 *
 * // For InputType
 * @InputType()
 * class CombinedInput extends Merge([UserInput, ProfileInput], 'input') {}
 * ```
 */
export function Merge<T extends ClassType[]>(
  Classes: T,
  _kind: TypeKind = 'object'
): ClassType {
  const ChildClass = class {};

  const storage = getMetadataStorage();

  Classes.forEach((BaseClass) => {
    storage.fields.forEach((f) => {
      if (f.target !== BaseClass && !(BaseClass.prototype instanceof (f.target as any))) {
        return;
      }

      if (typeof f.getType === 'function') {
        f.getType();
      }

      const exists = storage.fields.some(
        (existing) => existing.target === ChildClass && existing.name === f.name
      );

      if (!exists) {
        storage.fields.push({ ...f, target: ChildClass });
      }
    });
  });

  return ChildClass;
}
