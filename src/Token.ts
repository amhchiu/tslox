import type { TokenType } from "./TokenType.ts";

export type Literal = string | number | boolean | null;

/**
 * @example
 *
 * const numberToken = new Token(
 *     TokenType.NUMBER,
 *     "123.45",
 *     123.45,
 *     1
 *  );
 */
export class Token {
  constructor(
    private readonly type: TokenType,
    private readonly lexeme: string,
    private readonly literal: Literal,
    private readonly line: number,
  ) {}

  toString(): string {
    return this.type + " " + this.lexeme + " " + this.literal;
  }
}
