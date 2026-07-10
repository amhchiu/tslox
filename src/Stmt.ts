import type { Expr } from "./Expr.js";
import type { Token } from "./Token.js";

export interface Visitor<R> {
  visitExpressionStmt(stmt: Expression): R;
  visitPrintStmt(stmt: Print): R;
  visitVarStmt(stmt: VarDecl): R;
  visitBlockStmt(stmt: Block): R;
}

/**
 * Stmt base class represents all declarations and statements.
 *
 * Why the misleading name? Because in language design, syntax is broadly 'expressions' and 'statements'.
 * In this model, varDecl would be considered a declaration statement.
 *
 * In crafting interpreters, VarStmt is the `varDecl` nonterminal symbol.
 * In our grammar rule, declaration is a parent of statement.
 * In our AST class heirarchy (here) Stmt contains Var.
 */
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

export class VarDecl extends Stmt {
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

/**
 * Block is a series of statements or declarations surrounded by curly braces
 * block → "{" declaration* "}" ;
 */
export class Block extends Stmt {
  constructor(readonly statements: Stmt[]) {
    super();
  }

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitBlockStmt(this);
  }
}
