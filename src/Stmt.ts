import type { Expr } from "./Expr.js";
import type { Token } from "./Token.js";

/**
 * Statement and declaration AST nodes for Lox.
 * Implemented using tagged (discriminated) unions and switch-case pattern matching.
 */

export class Expression {
  readonly kind = "Expression" as const;

  constructor(readonly expression: Expr) {}
}

export class Print {
  readonly kind = "Print" as const;

  constructor(readonly expression: Expr) {}
}

export class VarDecl {
  readonly kind = "VarDecl" as const;

  constructor(
    readonly name: Token,
    readonly initializer: Expr | null,
  ) {}
}

/**
 * Block is a series of statements or declarations surrounded by curly braces
 * block → "{" declaration* "}" ;
 */
export class Block {
  readonly kind = "Block" as const;

  constructor(readonly statements: Stmt[]) {}
}

/**
 * Discriminated union of all statement nodes.
 */
export type Stmt = Expression | Print | VarDecl | Block;
