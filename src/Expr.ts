/**
 * In https://craftinginterpreters.com/representing-code.html#implementing-syntax-trees we have defined the production rules
 * for the syntactic grammar of our language, Lox, in modified BNF arrow notation. 
 *
 * @example
 *
 * expression -> literal
               | unary
               | binary
               | grouping
               | ternary ;
 *
 * We want to convert this into code now. Remember, the point of our parser is we have the stream of tokens
 * which are the sequence of terminal and non-terminal symbols in syntactic grammar; and we want to derive the final sequence of terminal "letters" via the grammar rules.
 *
 * This is implemented using a functional style with tagged (discriminated) unions and switch-case pattern matching.
 */

import type { Token, TokenLiteral } from "./Token.js";

/**
 * Binary production rule:
 *
 * binary -> expression operator expression ;
 *
 * @example
 * 1 + 2
 */
export class Binary {
  readonly kind = "Binary" as const;

  constructor(
    readonly left: Expr,
    readonly operator: Token,
    readonly right: Expr,
  ) {}
}

/**
 * Grouping production rule:
 *
 * grouping → "(" expression ")" ;
 *
 * @example
 * (1 + 2)
 */
export class Grouping {
  readonly kind = "Grouping" as const;

  constructor(readonly expression: Expr) {}
}

/**
 * Literal production rule:
 *
 * literal → NUMBER | STRING | "true" | "false" | "nil" ;
 *
 * @example
 * 123
 * "hello"
 * true
 * nil
 */
export class Literal {
  readonly kind = "Literal" as const;

  constructor(readonly value: TokenLiteral) {}
}

/**
 * Unary production rule:
 *
 * unary → ( "-" | "!" ) expression ;
 *
 * @example
 * -123
 * !true
 */
export class Unary {
  readonly kind = "Unary" as const;

  constructor(
    readonly operator: Token,
    readonly right: Expr,
  ) {}
}

/**
 * Ternary production rule:
 *
 * equality -> equality "?" equality ":" equality ;
 *
 * @example
 * condition ? 1 : 2
 */
export class Ternary {
  readonly kind = "Ternary" as const;

  constructor(
    readonly condition: Expr,
    readonly thenBranch: Expr,
    readonly elseBranch: Expr,
  ) {}
}

/**
 * Node for use in primary production rule
 *
 * primary -> ... | IDENTIFIER ;
 *
 * @example
 * breakfast
 */
export class Variable {
  readonly kind = "Variable" as const;

  constructor(readonly name: Token) {}
}

/**
 * Assignment production rule:
 *
 * assignment -> IDENTIFIER "=" assignment | ternary ;
 *
 * @example
 * a = 1
 */
export class Assign {
  readonly kind = "Assign" as const;

  constructor(
    readonly name: Token,
    readonly value: Expr,
  ) {}
}

/**
 * Discriminated union of all expression nodes.
 */
export type Expr =
  | Binary
  | Grouping
  | Literal
  | Unary
  | Ternary
  | Variable
  | Assign;
