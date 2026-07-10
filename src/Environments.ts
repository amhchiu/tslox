import type { LoxValue } from "./Interpreter.js";
import { RuntimeError } from "./RuntimeError.js";
import type { Token } from "./Token.js";

export class Environment {
  private values = new Map<string, LoxValue>();
  readonly enclosing: Environment | null;

  constructor(enclosing: Environment | null = null) {
    this.enclosing = enclosing;
  }

  define(name: string, value: LoxValue) {
    this.values.set(name, value);
  }

  assign(name: Token, value: LoxValue) {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }

    if (this.enclosing !== null) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new RuntimeError(name, "Undefined variable '" + name.lexeme + "'.");
  }

  get(name: Token): LoxValue {
    const found = this.values.get(name.lexeme);
    if (found) {
      return found;
    }

    // if variable isn't found in this environment, try enclosing one... recursively
    if (this.enclosing !== null) return this.enclosing.get(name);

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }
}
