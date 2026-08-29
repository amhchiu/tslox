import type { Expr } from "./Expr.js";

export class AstPrinter {
  print(expr: Expr): string {
    switch (expr.kind) {
      case "Binary":
        return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);

      case "Grouping":
        return this.parenthesize("group", expr.expression);

      case "Literal":
        if (expr.value === null) return "nil";
        return String(expr.value);

      case "Unary":
        return this.parenthesize(expr.operator.lexeme, expr.right);

      case "Ternary":
        return this.parenthesize("?", expr.condition, expr.thenBranch, expr.elseBranch);

      case "Variable":
        return expr.name.lexeme;

      case "Assign":
        // a = 5 -> lisp like prefix notation (= a 5)
        return this.parenthesize(`= ${expr.name.lexeme}`, expr.value);

      default: {
        const _exhaustiveCheck: never = expr;
        throw new Error(`Unhandled expression kind: ${JSON.stringify(_exhaustiveCheck)}`);
      }
    }
  }

  private parenthesize(name: string, ...exprs: Expr[]): string {
    let result = `(${name}`;
    for (const expr of exprs) {
      result += ` ${this.print(expr)}`;
    }
    result += ")";
    return result;
  }
}
