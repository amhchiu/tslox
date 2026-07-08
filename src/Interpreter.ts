import { Environment } from "./Environments.js";
import {
  Binary,
  Expr,
  Grouping,
  Literal,
  Ternary,
  Unary,
  Variable,
  type Visitor as ExprVisitor,
} from "./Expr.js";
import { Lox } from "./Lox.js";
import { RuntimeError } from "./RuntimeError.js";
import type { Expression, Print, Stmt, Visitor as StmtVisitor, Var as VarStmt } from "./Stmt.js";
import type { Token } from "./Token.js";
import { TokenType } from "./TokenType.js";

export type LoxValue = string | number | boolean | null;

export class Interpreter implements ExprVisitor<LoxValue>, StmtVisitor<LoxValue> {
  private environment = new Environment();

  visitExpressionStmt(stmt: Expression): LoxValue {
    this.evaluate(stmt.expression);
    return null;
  }

  visitPrintStmt(stmt: Print): LoxValue {
    const value = this.evaluate(stmt.expression);
    console.log(this.stringify(value));
    return null;
  }

  visitVarStmt(stmt: VarStmt): LoxValue {
    let value: LoxValue = null;
    if (stmt.initializer !== null) {
      value = this.evaluate(stmt.initializer);
    }
    this.environment.define(stmt.name.lexeme, value);
    return null;
  }

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

  visitVariableExpr(expr: Variable): LoxValue {
    return this.environment.get(expr.name);
  }

  visitBinaryExpr(expr: Binary): LoxValue {
    // postorder, left right root
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

  visitGroupingExpr(expr: Grouping): LoxValue {
    // evaluate the expression in the group
    return this.evaluate(expr.expression);
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
        this.checkNumberOperand(expr.operator, right);
        return -Number(right);
      case TokenType.BANG:
        return !this.isTruthy(right);
    }

    return null;
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

  visitTernaryExpr(expr: Ternary): LoxValue {
    const condition = this.evaluate(expr.condition);
    if (this.isTruthy(condition)) {
      return this.evaluate(expr.thenBranch);
    } else {
      return this.evaluate(expr.elseBranch);
    }
  }

  private evaluate(expr: Expr): LoxValue {
    // evaluate itself
    return expr.accept(this);
  }

  private execute(statement: Stmt) {
    statement.accept(this);
  }
}
