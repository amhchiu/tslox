import { Environment } from "./Environments.js";
import type { Expr } from "./Expr.js";
import { Lox } from "./Lox.js";
import { RuntimeError } from "./RuntimeError.js";
import type { Stmt } from "./Stmt.js";
import type { Token } from "./Token.js";
import { TokenType } from "./TokenType.js";

export type LoxValue = string | number | boolean | null;

export class Interpreter {
  private environment = new Environment();

  interpret(statements: Array<Stmt>) {
    try {
      for (const statement of statements) {
        this.execute(statement);
      }
    } catch (err) {
      if (err instanceof RuntimeError) {
        Lox.runtimeError(err);
      } else {
        throw err;
      }
    }
  }

  interpretExpression(expression: Expr) {
    try {
      const value = this.evaluate(expression);
      console.log(this.stringify(value));
    } catch (error) {
      if (error instanceof RuntimeError) {
        Lox.runtimeError(error);
      } else {
        throw error;
      }
    }
  }

  private evaluate(expr: Expr): LoxValue {
    switch (expr.kind) {
      case "Literal":
        return expr.value;

      case "Grouping":
        return this.evaluate(expr.expression);

      case "Unary": {
        const right = this.evaluate(expr.right);

        switch (expr.operator.type) {
          case TokenType.MINUS:
            this.checkNumberOperand(expr.operator, right);
            return -Number(right);
          case TokenType.BANG:
            return !this.isTruthy(right);
        }

        return null;
      }

      case "Binary": {
        // postorder: left, right, root
        const left = this.evaluate(expr.left);
        const right = this.evaluate(expr.right);

        switch (expr.operator.type) {
          // comparison operations
          case TokenType.GREATER:
            this.checkNumberOperands(expr.operator, left, right);
            return Number(left) > Number(right);
          case TokenType.GREATER_EQUAL:
            this.checkNumberOperands(expr.operator, left, right);
            return Number(left) >= Number(right);
          case TokenType.LESS:
            this.checkNumberOperands(expr.operator, left, right);
            return Number(left) < Number(right);
          case TokenType.LESS_EQUAL:
            this.checkNumberOperands(expr.operator, left, right);
            return Number(left) <= Number(right);
          // equality
          case TokenType.BANG_EQUAL:
            return !this.isEqual(left, right);
          case TokenType.EQUAL_EQUAL:
            return this.isEqual(left, right);
          // arithmetic operations
          case TokenType.MINUS:
            this.checkNumberOperands(expr.operator, left, right);
            return Number(left) - Number(right);
          case TokenType.SLASH:
            this.checkNumberOperands(expr.operator, left, right);
            return Number(left) / Number(right);
          case TokenType.STAR:
            this.checkNumberOperands(expr.operator, left, right);
            return Number(left) * Number(right);
          case TokenType.PLUS:
            if (typeof left === "number" && typeof right === "number") {
              return left + right;
            }
            if (typeof left === "string" || typeof right === "string") {
              return String(left).concat(String(right));
            }
            // throw error if neither cases match
            throw new RuntimeError(expr.operator, "Operands must be two numbers or two strings.");
          // other operators
          case TokenType.COMMA:
            return right;
        }

        return null;
      }

      case "Ternary": {
        const condition = this.evaluate(expr.condition);
        if (this.isTruthy(condition)) {
          return this.evaluate(expr.thenBranch);
        } else {
          return this.evaluate(expr.elseBranch);
        }
      }

      case "Variable":
        return this.environment.get(expr.name);

      case "Assign": {
        const value = this.evaluate(expr.value);
        this.environment.assign(expr.name, value);
        return value;
      }

      case "Logical": {
        const left = this.evaluate(expr.left);

        if (expr.operator.type === TokenType.OR) {
          if (this.isTruthy(left)) return left;
        } else if (expr.operator.type === TokenType.AND) {
          if (!this.isTruthy(left)) return left; // `print false and "apple"` -> prints false. short circuit
        }

        return this.evaluate(expr.right);
      }

      default: {
        const _exhaustiveCheck: never = expr;
        throw new Error(`Unhandled expression kind: ${JSON.stringify(_exhaustiveCheck)}`);
      }
    }
  }

  private execute(statement: Stmt): void {
    switch (statement.kind) {
      case "Expression":
        this.evaluate(statement.expression);
        break;

      case "Print": {
        const value = this.evaluate(statement.expression);
        console.log(this.stringify(value));
        break;
      }

      case "VarDecl": {
        let value: LoxValue = null;
        if (statement.initializer !== null) {
          value = this.evaluate(statement.initializer);
        }
        this.environment.define(statement.name.lexeme, value);
        break;
      }

      case "Block":
        this.executeBlock(statement.statements, new Environment(this.environment));
        break;

      case "If":
        if (this.isTruthy(this.evaluate(statement.condition))) {
          this.execute(statement.thenBranch);
        } else if (statement.elseBranch !== null) {
          this.execute(statement.elseBranch);
        }
        break;

      case "While":
        while (this.isTruthy(this.evaluate(statement.condition))) {
          this.execute(statement.body);
        }
        break;

      default: {
        const _exhaustiveCheck: never = statement;
        throw new Error(`Unhandled statement kind: ${JSON.stringify(_exhaustiveCheck)}`);
      }
    }
  }

  executeBlock(statements: Stmt[], environment: Environment) {
    const previous = this.environment;
    try {
      this.environment = environment;

      for (const statement of statements) {
        this.execute(statement);
      }
    } finally {
      this.environment = previous;
    }
  }

  private checkNumberOperand(operator: Token, operand: LoxValue) {
    if (typeof operand === "number") {
      return;
    }
    throw new RuntimeError(operator, "Operand must be a number");
  }

  private checkNumberOperands(operator: Token, left: LoxValue, right: LoxValue) {
    if (typeof left === "number" && typeof right == "number") return;

    throw new RuntimeError(operator, "Operands must be numbers.");
  }

  private isTruthy(value: LoxValue): boolean {
    if (value === null) return false;
    if (typeof value === "boolean") return value;
    return true;
  }

  private isEqual(a: LoxValue, b: LoxValue): boolean {
    return a === b;
  }

  private stringify(value: LoxValue) {
    if (value === null) return "nil";
    return String(value);
  }
}
