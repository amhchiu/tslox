import type { Token } from "./Token.js";

export class RuntimeError extends Error {
  constructor(
    readonly token: Token,
    message: string,
  ) {
    super(message);

    // Set the prototype explicitly (recommended when extending built-in classes in TS/JS)
    Object.setPrototypeOf(this, RuntimeError.prototype);
  }
}
