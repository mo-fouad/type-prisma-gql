// Opt-in validation support using class-validator
// Only loads if class-validator is installed

export interface ValidationError {
  property: string;
  constraints: Record<string, string>;
  children?: ValidationError[];
}

export class ValidationFailedError extends Error {
  constructor(public validationErrors: ValidationError[]) {
    super("Validation failed");
    Object.setPrototypeOf(this, ValidationFailedError.prototype);
  }
}

let classValidator: any = null;

// Lazy load class-validator to keep it optional
function getClassValidator() {
  if (classValidator === null) {
    try {
      classValidator = require("class-validator");
    } catch (err) {
      throw new Error(
        "class-validator is not installed. Install it with: npm install class-validator"
      );
    }
  }
  return classValidator;
}

/**
 * Validates an object using class-validator decorators
 * @param obj Object to validate
 * @param skipMissingProperties Skip validation of missing properties
 */
export async function validateObject(
  obj: object,
  skipMissingProperties = false
): Promise<void> {
  const validator = getClassValidator();

  const errors = await validator.validate(obj, {
    skipMissingProperties,
    forbidUnknownValues: false,
  });

  if (errors.length > 0) {
    const validationErrors: ValidationError[] = errors.map((error: any) => ({
      property: error.property,
      constraints: error.constraints || {},
      children: error.children,
    }));

    throw new ValidationFailedError(validationErrors);
  }
}

/**
 * Check if validation is enabled (class-validator is installed)
 */
export function isValidationEnabled(): boolean {
  try {
    require.resolve("class-validator");
    return true;
  } catch {
    return false;
  }
}
