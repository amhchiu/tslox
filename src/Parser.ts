import { Binary, Expr, Grouping, Literal, Unary } from "./Expr.js";
import { Lox } from "./Lox.js";
import type { Token } from "./Token.js";
import { TokenType } from "./TokenType.js";

class ParseError extends Error {
  constructor() {
    super();
  }
}

/**
 * Each grammar rule becomes a method inside this class
 * 
 * ```
 *  expression     → equality ;
    equality       → comparison ( ( "!=" | "==" ) comparison )* ;
    comparison     → term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
    term           → factor ( ( "-" | "+" ) factor )* ;
    factor         → unary ( ( "/" | "*" ) unary )* ;
    unary          → ( "!" | "-" ) unary
                   | primary ;
    primary        → NUMBER | STRING | "true" | "false" | "nil"
                   | "(" expression ")" ;
   ```
 */
export class Parser {
  private current = 0;

  constructor(readonly tokens: Token[]) { }

  /**
   * Entrypoint to run the parser on the tokens
   *
   * @returns successfully parsed expression or null if syntax error
   */
  public parse() {
    try {
      return this.expression();
    } catch (error) {
      if (error instanceof ParseError) {
        return null;
      }
      throw error;
    }
  }

  /**
   * expression -> equality
   */
  private expression() {
    return this.equality();
  }

  /**
   * equality → comparison ( ( "!=" | "==" ) comparison )* ;
   */
  private equality(): Expr {
    let expr: Expr = this.comparison();

    while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      // binary -> expression operator expression
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  /**
   * comparison → term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
   */
  private comparison(): Expr {
    let expr: Expr = this.term();

    while (
      this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)
    ) {
      const operator = this.previous();
      const right = this.term();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  /**
   * term → factor ( ( "-" | "+" ) factor )* ;
   */
  private term(): Expr {
    let expr = this.factor();

    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous();
      const right = this.factor();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  /**
   * factor → unary ( ( "/" | "*" ) unary )* ;
   */
  private factor(): Expr {
    let expr = this.unary();

    while (this.match(TokenType.SLASH, TokenType.STAR)) {
      const operator = this.previous();
      const right = this.unary();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  /**
   * unary → ( "!" | "-" ) unary | primary ;
   */
  private unary(): Expr {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.unary();
      return new Unary(operator, right);
    }

    return this.primary();
  }

  /**
   * primary → NUMBER | STRING | "true" | "false" | "nil" 
                | "(" expression ")" ;
   */
  private primary(): Expr {
    if (this.match(TokenType.FALSE)) return new Literal(false);
    if (this.match(TokenType.TRUE)) return new Literal(true);
    if (this.match(TokenType.NIL)) return new Literal(null);

    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      return new Literal(this.previous().literal);
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      return new Grouping(expr);
    }

    throw this.error(this.peek(), "Expect expression.");
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();

    throw this.error(this.peek(), message);
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type == type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type == TokenType.EOF;
  }

  private peek(): Token {
    const token = this.tokens[this.current];
    if (token === undefined) {
      throw new Error("Tried to peek beyond end of token stream");
    }
    return token;
  }

  private previous(): Token {
    const token = this.tokens[this.current - 1];
    if (token === undefined) {
      throw new Error("Tried to access previous token before index 0");
    }
    return token;
  }

  /**
   * We throw a ParseError to unwind the call stack, bypassing rest of the parsing function until try/catch reached,
   * where the parser can synchronise or recover -> This is called synchronization
   *
   * By doing this, we can discard the remaining tokens until we reach a new boundary to start safely parsing again
   */
  private error(token: Token, message: string): ParseError {
    Lox.tokenError(token, message);
    return new ParseError();
  }

  /**
   * After catching a ParseError, we will call this
   *
   * It discards tokens until it thinks it has found a statement boundary (heiristically, a keyword or semicolon determines the boundary)
   *
   * @link https://craftinginterpreters.com/parsing-expressions.html#synchronizing-a-recursive-descent-parser
   */
  private synchronize(): void {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type == TokenType.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenType.CLASS:
        case TokenType.FUN:
        case TokenType.VAR:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.PRINT:
        case TokenType.RETURN:
          return;
      }

      this.advance();
    }
  }
}
