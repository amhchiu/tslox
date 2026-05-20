import { Token, type Literal } from "./Token.js";
import { TokenType } from "./TokenType.js";

/**
 * @link https://craftinginterpreters.com/scanning.html#the-scanner-class
 */
export class Scanner {
  /** Build up the tokens */
  private tokens: Token[] = new Array();
  /** index pointing to beginning of the lexeme we are currently scanning */
  private start = 0;
  /** index pointing to next character we have not yet scanned */
  private current = 0;
  /**  */
  private line = 1;

  constructor(private readonly source: string) {}

  scanTokens() {
    while (!this.isAtEnd()) {
      // We are at the beginning of the next lexeme
      this.start = this.current;
      // each loop, scan a single token
      this.scanToken();
    }

    this.tokens.push(new Token(TokenType.EOF, "", null, this.line));
    return this.tokens;
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  /**
   * - Scan the token at this.current
   */
  private scanToken() {
    const c = this.advance();
    switch (c) {
      case "(":
        this.addToken(TokenType.LEFT_PAREN);
        break;
      case ")":
        this.addToken(TokenType.RIGHT_PAREN);
        break;
      case "{":
        this.addToken(TokenType.LEFT_BRACE);
        break;
      case "}":
        this.addToken(TokenType.RIGHT_BRACE);
        break;
      case ",":
        this.addToken(TokenType.COMMA);
        break;
      case ".":
        this.addToken(TokenType.DOT);
        break;
      case "-":
        this.addToken(TokenType.MINUS);
        break;
      case "+":
        this.addToken(TokenType.PLUS);
        break;
      case ";":
        this.addToken(TokenType.SEMICOLON);
        break;
      case "*":
        this.addToken(TokenType.STAR);
        break;
    }
  }

  private advance(): string {
    return this.source.charAt(this.current++);
  }

  private addToken(type: TokenType, literal: Literal = null) {
    // from the source code, extract the slice of text between beginning of lexeme we are scanning to current index
    const text = this.source.substring(this.start, this.current);
    // Append newly created token to end of tokens array
    this.tokens.push(new Token(type, text, literal, this.line));
  }
}
