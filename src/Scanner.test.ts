import { describe, expect, it } from "vitest";
import { Scanner } from "./Scanner.js";
import { TokenType } from "./TokenType.js";

describe("Scanner", () => {
  it("should scan single character tokens", () => {
    const scanner = new Scanner("(){}");
    const tokens = scanner.scanTokens();

    // The scanned tokens should be: (, ), {, }, and EOF
    expect(tokens).toHaveLength(5);

    // Let's assert on the string representation of the tokens
    expect(tokens[0]!.toString()).toBe(`${TokenType.LEFT_PAREN} ( null`);
    expect(tokens[1]!.toString()).toBe(`${TokenType.RIGHT_PAREN} ) null`);
    expect(tokens[2]!.toString()).toBe(`${TokenType.LEFT_BRACE} { null`);
    expect(tokens[3]!.toString()).toBe(`${TokenType.RIGHT_BRACE} } null`);
    expect(tokens[4]!.toString()).toBe(`${TokenType.EOF}  null`);
  });
});
