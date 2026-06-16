import { Lox } from "./Lox.js";
import { Token, type TokenLiteral } from "./Token.js";
import { TokenType } from "./TokenType.js";

/**
 * To handle keywords, we see if the identifier’s lexeme is one of the reserved words
 */
const KEYWORDS: Record<string, TokenType> = {
  and: TokenType.AND,
  class: TokenType.CLASS,
  else: TokenType.ELSE,
  false: TokenType.FALSE,
  for: TokenType.FOR,
  fun: TokenType.FUN,
  if: TokenType.IF,
  nil: TokenType.NIL,
  or: TokenType.OR,
  print: TokenType.PRINT,
  return: TokenType.RETURN,
  super: TokenType.SUPER,
  this: TokenType.THIS,
  true: TokenType.TRUE,
  var: TokenType.VAR,
  while: TokenType.WHILE,
};

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

  private number() {
    while (this.isDigit(this.peek())) this.advance();

    // Look for a fractional part.
    if (this.peek() == "." && this.isDigit(this.peekNext())) {
      // Consume the "."
      this.advance();

      while (this.isDigit(this.peek())) this.advance();
    }

    this.addToken(TokenType.NUMBER, Number(this.source.substring(this.start, this.current)));
  }

  /**
   * - Scan the token at this.current
   */
  private scanToken() {
    const c = this.advance();
    switch (c) {
      case "?":
        this.addToken(TokenType.QUESTION);
        break;
      case ":":
        this.addToken(TokenType.COLON);
        break;
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
      case "!":
        this.addToken(this.match("=") ? TokenType.BANG_EQUAL : TokenType.BANG);
        break;
      case "=":
        this.addToken(this.match("=") ? TokenType.EQUAL_EQUAL : TokenType.EQUAL);
        break;
      case "<":
        this.addToken(this.match("=") ? TokenType.LESS_EQUAL : TokenType.LESS);
        break;
      case ">":
        this.addToken(this.match("=") ? TokenType.GREATER_EQUAL : TokenType.GREATER);
        break;
      case "/":
        if (this.match("/")) {
          // A comment goes until the end of the line.
          // comments are not meaningful so we ignore them in parser, hence advance
          while (this.peek() != "\n" && !this.isAtEnd()) this.advance();
        } else if (this.match("*")) {
          // same with block comment, we don't create tokens
          this.blockComment();
        } else {
          this.addToken(TokenType.SLASH);
        }
        break;
      case " ":
      case "\r":
      case "\t":
        // Ignore whitespace.
        break;
      case "\n":
        this.line++;
        break;
      // string literal
      case '"':
        this.string();
        break;
      default:
        // allow: 1234, 12.34 invalid: .1234, 1234.
        if (this.isDigit(c)) {
          this.number();
          // assume any lexeme starting with underscore or letter is an identifier
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          Lox.error(this.line, "Unexpected character.");
        }
        break;
    }
  }

  /**
   * Check the identifier is a reserved keyword
   */
  private identifier() {
    while (this.isAlphaNumeric(this.peek())) this.advance();

    const text: string = this.source.substring(this.start, this.current);
    // is it reserve word or user defined identifier
    const type = KEYWORDS[text] ?? TokenType.IDENTIFIER;

    this.addToken(type);
  }

  private blockComment(): void {
    while (!this.isAtEnd()) {
      if (this.peek() === "\n") {
        this.line++;
      }

      if (this.peek() === "*" && this.peekNext() === "/") {
        // Consume '*' and '/'
        this.advance();
        this.advance();
        return;
      }

      this.advance();
    }

    Lox.error(this.line, "Unterminated block comment.");
  }

  private string(): void {
    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() === "\n") this.line++;
      this.advance();
    }

    if (this.isAtEnd()) {
      Lox.error(this.line, "Unterminated string.");
      return;
    }

    // The closing ".
    this.advance();

    // Trim the surrounding quotes.
    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(TokenType.STRING, value);
  }

  /**
   * e.g. we arrive at '!', and look at next character
   * if it is the end of the lexeme, false
   * if next character equals expected, it is match ('!='), return true
   */
  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) !== expected) return false;

    this.current++;
    return true;
  }

  private peek(): string {
    // one character lookahead
    if (this.isAtEnd()) return "\0";
    return this.source.charAt(this.current);
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return "\0";
    return this.source.charAt(this.current + 1);
  }

  private isAlpha(c: string): boolean {
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c == "_";
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c);
  }

  /**
   * digit is 0 to 9
   */
  private isDigit(c: string): boolean {
    return c >= "0" && c <= "9";
  }

  /** Advance the index pointing to next character */
  private advance(): string {
    return this.source.charAt(this.current++);
  }

  private addToken(type: TokenType, literal: TokenLiteral = null) {
    // from the source code, extract the slice of text between beginning of lexeme we are scanning to current index
    const text = this.source.substring(this.start, this.current);
    // Append newly created token to end of tokens array
    this.tokens.push(new Token(type, text, literal, this.line));
  }
}
