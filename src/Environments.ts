import type { LoxValue } from "./Interpreter.js";
import { RuntimeError } from "./RuntimeError.js";
import type { Token } from "./Token.js";

export class Environment {
  private values = new Map<string, LoxValue>();

  define(name: string, value: LoxValue) {
    this.values.set(name, value);
  }

  assign(name: Token, value: LoxValue) {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }

    throw new RuntimeError(name, "Undefined variable '" + name.lexeme + "'.");
  }

  get(name: Token): LoxValue {
    const found = this.values.get(name.lexeme);
    if (found) {
      return found;
    }

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }
}
