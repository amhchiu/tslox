import { describe, it, expect } from "vitest";
import { Scanner } from "./Scanner.js";
import { Parser } from "./Parser.js";
import { AstPrinter } from "./AstPrinter.js";

function parseAndPrint(source: string): string {
  const scanner = new Scanner(source);
  const parser = new Parser(scanner.scanTokens());
  const expression = parser.parse();
  if (!expression) throw new Error(`Failed to parse expression: "${source}"`);
  return new AstPrinter().print(expression);
}

describe("Parser & AstPrinter Integration", () => {
  it("parses precedence correctly", () => {
    // Multiplication binds tighter than addition
    expect(parseAndPrint("1 + 2 * 3")).toBe("(+ 1 (* 2 3))");
    expect(parseAndPrint("1 * 2 + 3")).toBe("(+ (* 1 2) 3)");

    // Division binds tighter than subtraction
    expect(parseAndPrint("4 - 6 / 2")).toBe("(- 4 (/ 6 2))");
  });

  it("parses associativity correctly (left-associative)", () => {
    // Left-to-right grouping for same precedence
    expect(parseAndPrint("1 + 2 + 3")).toBe("(+ (+ 1 2) 3)");
    expect(parseAndPrint("10 - 4 - 2")).toBe("(- (- 10 4) 2)");
    expect(parseAndPrint("8 / 4 / 2")).toBe("(/ (/ 8 4) 2)");
  });

  it("parses grouping parentheses correctly", () => {
    // Overriding natural precedence using parentheses
    expect(parseAndPrint("(1 + 2) * 3")).toBe("(* (group (+ 1 2)) 3)");
    expect(parseAndPrint("4 / (2 - 1)")).toBe("(/ 4 (group (- 2 1)))");
  });

  it("parses unary operators correctly", () => {
    expect(parseAndPrint("-123")).toBe("(- 123)");
    expect(parseAndPrint("!true")).toBe("(! true)");
    expect(parseAndPrint("!!false")).toBe("(! (! false))");
    expect(parseAndPrint("-(-5)")).toBe("(- (group (- 5)))");
  });

  it("parses comparison and equality operators correctly", () => {
    expect(parseAndPrint("1 < 2")).toBe("(< 1 2)");
    expect(parseAndPrint("1 <= 2 >= 3")).toBe("(>= (<= 1 2) 3)");
    expect(parseAndPrint("1 == 2 != 3")).toBe("(!= (== 1 2) 3)");

    // Comparisons have higher precedence than equality
    expect(parseAndPrint("1 + 2 == 3")).toBe("(== (+ 1 2) 3)");
    expect(parseAndPrint("1 == 2 < 3")).toBe("(== 1 (< 2 3))");
  });

  it("parses literals (strings, numbers, booleans, nil) correctly", () => {
    expect(parseAndPrint('"hello"')).toBe("hello");
    expect(parseAndPrint("45.67")).toBe("45.67");
    expect(parseAndPrint("true")).toBe("true");
    expect(parseAndPrint("false")).toBe("false");
    expect(parseAndPrint("nil")).toBe("nil");
  });

  it("parses comma operator correctly (lowest precedence, left-associative)", () => {
    // 1, 2, 3 should group as ((1, 2), 3)
    expect(parseAndPrint("1, 2, 3")).toBe("(, (, 1 2) 3)");

    // Comma has lower precedence than addition and multiplication
    expect(parseAndPrint("1 + 2, 3 * 4")).toBe("(, (+ 1 2) (* 3 4))");
  });

  it("parses ternary operator correctly", () => {
    // Basic ternary
    expect(parseAndPrint("1 ? 2 : 3")).toBe("(? 1 2 3)");

    // Precedence: Equality binds tighter than ternary
    expect(parseAndPrint("1 == 2 ? 3 : 4")).toBe("(? (== 1 2) 3 4)");

    // Right-associativity: a ? b : c ? d : e parses as a ? b : (c ? d : e)
    expect(parseAndPrint("1 ? 2 : 3 ? 4 : 5")).toBe("(? 1 2 (? 3 4 5))");
  });
});
