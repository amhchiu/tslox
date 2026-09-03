import { describe, it, expect } from "vitest";
import { AstPrinter } from "./AstPrinter.js";
import { Binary, Grouping, Literal, Logical, Unary } from "./Expr.js";
import { Token } from "./Token.js";
import { TokenType } from "./TokenType.js";

describe("AstPrinter", () => {
  it("prints AST in parenthesized LISP-style format", () => {
    const expression = new Binary(
      new Unary(new Token(TokenType.MINUS, "-", null, 1), new Literal(123)),
      new Token(TokenType.STAR, "*", null, 1),
      new Grouping(new Literal(45.67)),
    );

    const printer = new AstPrinter();
    expect(printer.print(expression)).toBe("(* (- 123) (group 45.67))");
  });

  it("prints logical expressions", () => {
    const expression = new Logical(
      new Literal(true),
      new Token(TokenType.OR, "or", null, 1),
      new Literal(false),
    );

    const printer = new AstPrinter();
    expect(printer.print(expression)).toBe("(or true false)");
  });
});
