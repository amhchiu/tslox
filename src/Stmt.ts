import type { Expr } from "./Expr.js";
import type { Token } from "./Token.js";

/**
 * Statement and declaration AST nodes for Lox.
 * Implemented using tagged (discriminated) unions and switch-case pattern matching.
 */

/**
 * Expression statement production rule:
 *
 * exprStmt → expression ";" ;
 *
 * @example
 * 1 + 2;
 */
export class Expression {
  readonly kind = "Expression" as const;

  constructor(readonly expression: Expr) {}
}

/**
 * Print statement production rule:
 *
 * printStmt → "print" expression ";" ;
 *
 * @example
 * print "hello world";
 */
export class Print {
  readonly kind = "Print" as const;

  constructor(readonly expression: Expr) {}
}

/**
 * Variable declaration production rule:
 *
 * varDecl → "var" IDENTIFIER ( "=" expression )? ";" ;
 *
 * @example
 * var beverage = "espresso";
 * var a;
 */
export class VarDecl {
  readonly kind = "VarDecl" as const;

  constructor(
    readonly name: Token,
    readonly initializer: Expr | null,
  ) {}
}

/**
 * Block statement production rule:
 *
 * block → "{" declaration* "}" ;
 *
 * @example
 * {
 *   var a = 1;
 *   print a;
 * }
 */
export class Block {
  readonly kind = "Block" as const;

  constructor(readonly statements: Stmt[]) {}
}

export class If {
  readonly kind = "If" as const;

  constructor(
    readonly condition: Expr,
    readonly thenBranch: Stmt,
    readonly elseBranch: Stmt | null,
  ) {}
}

/**
 * While statement production rule:
 *
 * whileStmt → "while" "(" expression ")" statement ;
 *
 * @example
 * while (a < 10) {
 *   print a;
 *   a = a + 1;
 * }
 */
export class While {
  readonly kind = "While" as const;

  constructor(
    readonly condition: Expr,
    readonly body: Stmt,
  ) {}
}

/**
 * Discriminated union of all statement nodes.
 */
export type Stmt = Expression | If | Print | VarDecl | Block | While;
