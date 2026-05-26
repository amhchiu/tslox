/**
 * In https://craftinginterpreters.com/representing-code.html#implementing-syntax-trees we have defined the production rules
 * for the syntactic grammar of our language, Lox, in modified BNF arrow notation. 
 *
 * @example
 *
 * expression -> literal
               | unary
               | binary
               | grouping ;

 * We want to convert this into code now. Remember, the point of our parser is we have the stream of tokens
 * which are the sequence of terminal and non-terminal symbols in syntactic grammar; and we want to derive the final sequence of terminal "letters" via the grammar rules.
 *
 * As code, we implement this via the Visitor pattern (but can be implemented other ways).
 *
 * The left side of the BNF notation (non-terminal head) is the class we implement.
 *
 * The right side of the BNF notation (body) represents the derivation, which is the combination of terminal and non-terminal symbols. These are the properties of the class that can be visited.
 * 
 */

import type { Token, TokenLiteral } from "./Token.js";
import type { TokenType } from "./TokenType.js";

// e.g Interpreter or ASTPrinter.
interface Visitor<R> {
  visitBinaryExpr(expr: Binary): R;
  visitGroupingExpr(expr: Grouping): R;
  visitLiteralExpr(expr: Literal): R;
  visitUnaryExpr(expr: Unary): R;
}

// Visitor pattern, double dispatch. 
export abstract class Expr {
  abstract accept<R>(visitor: Visitor<R>): R;
}

/**
 * Binary production rule:
 *
 * binary -> expression operator expression ;
 *
 */
export class Binary extends Expr {
  constructor(
    readonly left: Expr,
    readonly operator: Token,
    readonly right: Expr,
  ) {
    super();
  }

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitBinaryExpr(this);
  }
}

/**
 * Grouping production rule:
 *
 * grouping → "(" expression ")" ;
 */
export class Grouping extends Expr {
  constructor(readonly expression: Expr) {
    super();
  }

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitGroupingExpr(this);
  }
}

/**
 * Literal production rule:
 *
 * literal → NUMBER | STRING | "true" | "false" | "nil" ;
 */
export class Literal extends Expr {
  constructor(readonly value: TokenLiteral) {
    super();
  }

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitLiteralExpr(this);
  }
}

/**
 * Unary production rule:
 *
 * unary → ( "-" | "!" ) expression ;
 */
export class Unary extends Expr {
  constructor(readonly operator: Token, readonly right: Expr) {
    super();
  }

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitUnaryExpr(this);
  }
}
