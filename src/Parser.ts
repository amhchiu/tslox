import {
  Assign,
  Binary,
  type Expr,
  Grouping,
  Literal,
  Logical,
  Ternary,
  Unary,
  Variable,
} from "./Expr.js";
import { Lox } from "./Lox.js";
import { Block, Break, Expression, If, Print, type Stmt, VarDecl, While } from "./Stmt.js";
import { Token } from "./Token.js";
import { TokenType } from "./TokenType.js";

class ParseError extends Error {
  constructor() {
    super();
  }
}

/**
 * The stratified grammar (concrete grammar) is used by the Parser to enforce
 * associativity and precedence. This builds the abstract syntax tree which is made up of the unstratratified grammar,
 * since the associativity and precedence is captured by the shape of the tree.
 *
 * Each grammar rule becomes a method inside this class
 *
 * ```
 *  program        → declaration* EOF ;                     // A program is a list of declarations
 *  declaration    → varDecl | statement ;                  // Declare variables, functions and classes and statements
 *  varDecl        → "var" IDENTIFIER ( "=" expression )? ";" ;
 *  statement      → exprStmt | forStmt | ifStmt | whileStmt | printStmt | block | breakStmt ;
 *  exprStmt       → expression ";" ;                       // expressions evaluate to a value
 *  forStmt        → "for" "(" ( varDecl | exprStmt | ";" )   // for ( var i = 0 ;       # Initialiser
 *                    expression? ";"                         //        i < 10 ;         # The condition to exit loop
 *                    expression? ")" statement ;             //        i = i + 1) print i;     # The increment
 *  ifStmt         → "if" "(" expression ")" statement ( "else" statement )? ;
 *  whileStmt      → "while" "(" expression ")" statement ;
 *  printstmt      → "print" expression ";" ;
 *  block          → "{" declaration* "}" ;
 *  break          → "break" ";" ;
 *
 *  expression     → comma ;
 *  comma          → assignment ( "," assignment )* ;
 *  assignment     → IDENTIFIER "=" assignment | ternary ;
 *  ternary        → logic_or ( "?" expression ":" ternary)? ;
 *  logic_or       → logic_and ( "or" logic_and )* ;        // ternary higher precedence, so `a and b ? c : d` evaluates as `(a and b) ? c : d`
 *  logic_and      → equality ( "and" equality )* ;
 *  equality       → comparison ( ( "!=" | "==" ) comparison )* ;
 *  comparison     → term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
 *  term           → factor ( ( "-" | "+" ) factor )* ;
 *  factor         → unary ( ( "/" | "*" ) unary )* ;
 *  unary          → ( "!" | "-" ) unary
 *                 | primary ;
 *  primary        → NUMBER | STRING | "true" | "false" | "nil"
 *                 | "(" expression ")"
 *                 | IDENTIFIER ;
 *                 // Error production rules - missing left hand side operand
 *                 | ( "!=" | "==" ) equality
 *                 | ( ">" | ">=" | "<" | "<=" ) comparison
 *                 | ( "+" ) term
 *                 | ( "/" | "*" ) factor ;
 *
 *  ```
 *
 * For the error production rules, we want to error when the left hand side operand is missing for the binary expressions
 * We also want to continue consuming the rest of the expressions.
 *
 * This is why the right-hand operand rule is the same precedence level, so the remaining tokens are processed with the same
 * production rule.
 */
export class Parser {
  private current = 0;
  private loopDepth = 0;

  constructor(
    readonly tokens: Token[],
    private readonly silent = false,
  ) {}

  /**
   * Entrypoint to run the parser on the tokens // program rule
   *
   * @returns successfully parsed expression or null if syntax error
   */
  public parse(): Stmt[] {
    const statements = new Array<Stmt>();
    while (!this.isAtEnd()) {
      const decl = this.declaration();
      if (decl !== null) {
        statements.push(decl);
      }
    }
    return statements;
  }

  /**
   * Parse single expression (Used by REPL)
   */
  public parseExpression(): Expr | null {
    try {
      const expression = this.expression();
      if (!this.isAtEnd()) return null;
      return expression;
    } catch {
      return null;
    }
  }

  /**
   * declaration → varDecl | statement ;
   */
  private declaration() {
    try {
      if (this.match(TokenType.VAR)) return this.varDeclaration();
      return this.statement();
    } catch {
      // Parser parses series of declarations. When ParseError is caught, we want to synchronise and continue on the next statement
      this.synchronize();
      return null;
    }
  }

  /**
   * varDecl → "var" IDENTIFIER ( "=" expression )? ";" ;
   */
  private varDeclaration(): Stmt {
    const name = this.consume(TokenType.IDENTIFIER, "Expected variable name");
    const initializer = this.match(TokenType.EQUAL) ? this.expression() : null;
    this.consume(TokenType.SEMICOLON, "Expect ';' after value");
    return new VarDecl(name, initializer);
  }

  /**
   * statement -> exprStmt | forStmt | ifStmt | printStmt | whileStmt | block | breakStmt ;
   */
  private statement(): Stmt {
    if (this.match(TokenType.FOR)) return this.forStatement();
    if (this.match(TokenType.IF)) return this.ifStatement();
    if (this.match(TokenType.PRINT)) return this.printStatement();
    if (this.match(TokenType.WHILE)) return this.whileStatement();
    if (this.match(TokenType.LEFT_BRACE)) return new Block(this.block());
    if (this.match(TokenType.BREAK)) return this.breakStatement();

    return this.expressionStatement();
  }
  /**
   * forStmt → "for" "(" ( varDecl | exprStmt | ";" ) expression? ";" expression? ")" statement ;
   *
   * Parser desugars syntax into simpler AST nodes that interpreter supports. Notice we do not have For node. We use existing nodes to represent the loop. for loop can be represented like:
   * { var i = 0; while (i < 10) { print i; i = i + 1; } }
   */
  private forStatement(): Stmt {
    // 1. Initializer: can be omitted (;), a variable declaration (var i = 0;), or an expression (i = 0;).
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.");
    let initialiser: Stmt | null = null;
    if (this.match(TokenType.SEMICOLON)) {
      initialiser = null;
    } else if (this.match(TokenType.VAR)) {
      initialiser = this.varDeclaration();
    } else {
      initialiser = this.expressionStatement();
    }

    // 2. Condition: optional expression (e.g. i < 10;). If omitted, defaults to true later.
    let condition: Expr | null = null;
    if (!this.check(TokenType.SEMICOLON)) {
      condition = this.expression();
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' after loop condition.");

    // 3. Increment: optional expression evaluated after each loop iteration (e.g. i = i + 1).
    let increment: Expr | null = null;
    if (!this.check(TokenType.RIGHT_PAREN)) {
      increment = this.expression();
    }
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after for clauses.");

    try {
      this.loopDepth++;
      // 4. Desugar increment: runs after each iteration of the loop body.
      // e.g. { print i; i = i + 1; }
      let body = this.statement(); // print i;
      if (increment !== null) {
        // { print i; i = i + 1 }
        body = new Block([body, new Expression(increment)]);
      }

      // 5. Desugar condition into a while loop: defaults to infinite loop (while (true)) if omitted.
      // e.g. while (i < 10) { print i; i = i + 1; }
      if (condition === null) condition = new Literal(true);
      body = new While(condition, body);

      // 6. Desugar initializer: runs once before the loop, enclosed in a block to scope variables.
      // e.g. { var i = 0; while (i < 10) { ... } }
      if (initialiser !== null) {
        body = new Block([initialiser, body]);
      }

      return body;
    } finally {
      this.loopDepth--;
    }
  }

  /**
   * ifStmt → "if" "(" expression ")" statement ( "else" statement )? ;
   */
  private ifStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition.");

    const thenBranch = this.statement();
    let elseBranch: Stmt | null = null;
    if (this.match(TokenType.ELSE)) {
      elseBranch = this.statement();
    }

    return new If(condition, thenBranch, elseBranch);
  }

  /**
   * printstmt -> "print" expression ";" ;
   */
  private printStatement(): Stmt {
    const expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value");
    return new Print(expr);
  }

  /**
   *  whileStmt → "while" "(" expression ")" statement ;
   */
  private whileStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'while',");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after condition,");
    try {
      this.loopDepth++;
      const body = this.statement();
      return new While(condition, body);
    } finally {
      this.loopDepth--;
    }
  }

  /**
   * expressionStmt -> expression ";" ;
   */
  private expressionStatement(): Stmt {
    const expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
    return new Expression(expr);
  }

  /**
   * declaration -> varDecl | statement ;
   * block -> "{" declaration+ "}" ;
   */
  private block(): Stmt[] {
    const statements: Stmt[] = [];

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      const decl = this.declaration();
      if (decl) {
        statements.push(decl);
      }
    }

    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");
    return statements;
  }

  private breakStatement(): Stmt {
    if (this.loopDepth === 0) {
      this.error(this.previous(), "Must be inside a loop to use 'break'.");
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' after break.");
    return new Break();
  }

  /**
   * expression -> equality
   */
  private expression(): Expr {
    return this.comma();
  }

  /**
   * comma → assignment ( "," assignment )* ;
   */
  private comma(): Expr {
    let expr = this.assignment();

    while (this.match(TokenType.COMMA)) {
      const operator = this.previous();
      const right = this.assignment();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  /**
   * assignment → IDENTIFIER "=" assignment | ternary ;
   */
  private assignment(): Expr {
    const expr = this.ternary();

    if (this.match(TokenType.EQUAL)) {
      const equals = this.previous();
      const value = this.assignment();

      // Only assign valid variable targets, e.g. not 3 = 4;
      if (expr instanceof Variable) {
        const name = expr.name;
        return new Assign(name, value);
      }

      this.error(equals, "Invalid assignment target");
    }

    return expr;
  }

  /**
   * ternary → logic_or ( "?" expression ":" ternary)? ;
   */
  private ternary(): Expr {
    let expr = this.or();

    if (this.match(TokenType.QUESTION)) {
      const thenExpr = this.expression();
      this.consume(TokenType.COLON, ": expected after then expression");
      const elseExpr = this.ternary();
      expr = new Ternary(expr, thenExpr, elseExpr);
    }

    return expr;
  }

  /**
   * logic_or -> logic_and ( "or" logic_and )*
   */
  private or(): Expr {
    let expr = this.and();

    if (this.match(TokenType.OR)) {
      const operator = this.previous();
      const right = this.and();
      expr = new Logical(expr, operator, right);
    }
    return expr;
  }

  /**
   * logic_and → equality ( "and" equality )* ;
   */
  private and(): Expr {
    let expr = this.equality();

    if (this.match(TokenType.AND)) {
      const operator = this.previous();
      const right = this.equality();
      expr = new Logical(expr, operator, right);
    }

    return expr;
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
   * | "(" expression ")"
   * | IDENTIFIER ;
   */
  private primary(): Expr {
    if (this.match(TokenType.FALSE)) return new Literal(false);
    if (this.match(TokenType.TRUE)) return new Literal(true);
    if (this.match(TokenType.NIL)) return new Literal(null);

    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      return new Literal(this.previous().literal);
    }

    if (this.match(TokenType.IDENTIFIER)) {
      return new Variable(this.previous());
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      return new Grouping(expr);
    }

    // Error productions.
    if (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      this.error(this.previous(), "Missing left-hand operand.");
      this.equality();
      return new Literal(null);
    }

    if (
      this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)
    ) {
      this.error(this.previous(), "Missing left-hand operand.");
      this.comparison();
      return new Literal(null);
    }

    if (this.match(TokenType.PLUS)) {
      this.error(this.previous(), "Missing left-hand operand.");
      this.term();
      return new Literal(null);
    }

    if (this.match(TokenType.SLASH, TokenType.STAR)) {
      this.error(this.previous(), "Missing left-hand operand.");
      this.factor();
      return new Literal(null);
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
    if (!this.silent) {
      Lox.tokenError(token, message);
    }
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
