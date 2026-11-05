import "reflect-metadata";
import { InputType, Pick } from "type-prisma-gql";
import { User } from "./generated/Models/User";
import { Provider } from "./generated/Enums";

// This demonstrates that TypeScript now knows the exact fields on UserCreateInputPick
@InputType()
export class UserCreateInputPick extends Pick(User, {
  provider: true,
  providerId: true,
  email: true,
  password: true,
  otpCode: true,
}) {}

// TypeScript test - this should pass type checking
function testTypes() {
  const input = new UserCreateInputPick();

  // TypeScript knows these fields exist
  input.provider = Provider.EMAIL;
  input.email = "test@example.com";
  input.providerId = "123";
  input.password = "secret";
  input.otpCode = "123456";

  // TypeScript will error if we try to access fields that weren't picked
  // @ts-expect-error - userId was not picked
  input.userId = "test";

  // @ts-expect-error - createdAt was not picked
  input.createdAt = new Date();

  console.log("Type test passed!");
}

// Test that the instance has the correct type
type InstanceFields = keyof UserCreateInputPick;
// This should include: provider, providerId, email, password, otpCode

export { testTypes };
