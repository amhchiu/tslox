import { describe, expect, it, vi } from "vitest";
import { Lox } from "./Lox.js";
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

  it("should report error on unexpected characters", () => {
    // Reset error state
    Lox.hadError = false;

    // Spy on console.error to intercept the error message and avoid test logs pollution
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const scanner = new Scanner("@");
    scanner.scanTokens();

    // Assert that the error flag was toggled
    expect(Lox.hadError).toBe(true);

    // Assert that the exact formatted error message was printed
    expect(consoleSpy).toHaveBeenCalledWith("[line 1] Error: Unexpected character.");

    consoleSpy.mockRestore();
  });
});
