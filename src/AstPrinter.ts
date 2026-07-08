import {
  Expr,
  type Visitor,
  type Binary,
  type Grouping,
  type Literal,
  type Unary,
  Ternary,
  Variable,
  Assign,
} from "./Expr.js";

export class AstPrinter implements Visitor<string> {
  print(expr: Expr): string {
    return expr.accept(this);
  }

  visitBinaryExpr(expr: Binary): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  visitGroupingExpr(expr: Grouping): string {
    return this.parenthesize("group", expr.expression);
  }

  visitLiteralExpr(expr: Literal): string {
    if (expr.value === null) return "nil";
    return String(expr.value);
  }

  visitUnaryExpr(expr: Unary): string {
    return this.parenthesize(expr.operator.lexeme, expr.right);
  }

  visitTernaryExpr(expr: Ternary): string {
    return this.parenthesize("?", expr.condition, expr.thenBranch, expr.elseBranch);
  }

  visitVariableExpr(expr: Variable): string {
    return expr.name.lexeme;
  }

  visitAssignExpr(expr: Assign): string {
    // a = 5 -> lisp like prefix notation (= a 5)
    return this.parenthesize(`= ${expr.name.lexeme}`, expr.value) 
  }

  private parenthesize(name: string, ...exprs: Expr[]): string {
    let result = `(${name}`;
    for (const expr of exprs) {
      result += ` ${expr.accept(this)}`;
    }
    result += ")";
    return result;
  }
}
