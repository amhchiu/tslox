import type { Expr } from "./Expr.js";
import type { Token } from "./Token.js";

export interface Visitor<R> {
  visitExpressionStmt(stmt: Expression): R;
  visitPrintStmt(stmt: Print): R;
  visitVarStmt(stmt: Var): R;
}

export abstract class Stmt {
  abstract accept<R>(visitor: Visitor<R>): R;
}

export class Expression extends Stmt {
  constructor(readonly expression: Expr) {
    super();
  }

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitExpressionStmt(this);
  }
}

export class Print extends Stmt {
  constructor(readonly expression: Expr) {
    super();
  }

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitPrintStmt(this);
  }
}

export class Var extends Stmt {
  constructor(
    readonly name: Token,
    readonly initializer: Expr | null,
  ) {
    super();
  }

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitVarStmt(this);
  }
}
