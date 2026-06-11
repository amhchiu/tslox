import { Binary, Expr, Grouping, Literal, Ternary, Unary, type Visitor } from "./Expr.js";
import { TokenType } from "./TokenType.js";

type LoxValue = string | number | boolean | null;

export class Interpreter implements Visitor<LoxValue> {
  visitBinaryExpr(expr: Binary): LoxValue {
    // postorder, left right root
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      // comparison operations
      case TokenType.GREATER:
        return Number(left) > Number(right);
      case TokenType.GREATER_EQUAL:
        return Number(left) >= Number(right);
      case TokenType.LESS:
        return Number(left) < Number(right);
      case TokenType.LESS_EQUAL:
        return Number(left) <= Number(right);
      // equality
      case TokenType.BANG_EQUAL:
        return !this.isEqual(left, right);
      case TokenType.EQUAL_EQUAL:
        return this.isEqual(left, right);
      // arithmetic operations
      case TokenType.MINUS:
        return Number(left) - Number(right);
      case TokenType.SLASH:
        return Number(left) / Number(right);
      case TokenType.STAR:
        return Number(left) * Number(right);
      case TokenType.PLUS:
        if (typeof left === 'number' && typeof right === 'number') {
          return left + right;
        }
        if (typeof left === 'string' && typeof right === 'string') {
          return left.concat(right);
        }
        break;
      // other operators
      case TokenType.COMMA:
        return right;
    }

    return null;
  }
  visitGroupingExpr(expr: Grouping): LoxValue {
    // evaluate the expression in the group
    return this.evaluate(expr.expression)
  }
  visitLiteralExpr(expr: Literal): LoxValue {
    return expr.value;
  }
  /**
    * evaluate expression then apply unary operator on the value
    */
  visitUnaryExpr(expr: Unary): LoxValue {
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.MINUS:
        // TODO handle dynamic runtime error if not castable, because lox is dynamically typed language
        return -Number(right);
      case TokenType.BANG:
        return !this.isTruthy(right);
    }

    return null;
  }

  private isTruthy(value: LoxValue): boolean {
    if (value === null) return false;
    if (typeof value === 'boolean') return value;
    return true;
  }

  private isEqual(a: LoxValue, b: LoxValue): boolean {
    return a === b;
  }

  visitTernaryExpr(expr: Ternary): LoxValue {
    const condition = this.evaluate(expr.condition);
    if (this.isTruthy(condition)) {
      return this.evaluate(expr.thenBranch)
    } else {
      return this.evaluate(expr.elseBranch)
    }
  }

  private evaluate(expr: Expr): LoxValue {
    // evaluate itself
    return expr.accept(this);
  }
}
