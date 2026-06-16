import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Scanner } from "./Scanner.js";
import { Parser } from "./Parser.js";
import { Interpreter } from "./Interpreter.js";
import { Lox } from "./Lox.js";

describe("Interpreter Integration Tests", () => {
  let interpreter: Interpreter;
  let logSpy: any;

  beforeEach(() => {
    interpreter = new Interpreter();
    // Spy on console.log so we can capture the output of stringify
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    Lox.hadRuntimeError = false;
    Lox.hadError = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function run(source: string) {
    const scanner = new Scanner(source);
    const parser = new Parser(scanner.scanTokens());
    const expression = parser.parse();
    if (!expression) throw new Error(`Failed to parse: "${source}"`);
    interpreter.interpret(expression);
  }

  it("evaluates literals correctly", () => {
    run("123");
    expect(logSpy).toHaveBeenCalledWith("123");

    run('"hello"');
    expect(logSpy).toHaveBeenCalledWith("hello");

    run("true");
    expect(logSpy).toHaveBeenCalledWith("true");

    run("nil");
    expect(logSpy).toHaveBeenCalledWith("nil");
  });

  it("evaluates unary operators correctly", () => {
    run("-123");
    expect(logSpy).toHaveBeenCalledWith("-123");

    run("!true");
    expect(logSpy).toHaveBeenCalledWith("false");

    run("!!nil");
    expect(logSpy).toHaveBeenCalledWith("false");
  });

  it("evaluates binary arithmetic correctly", () => {
    run("2 * (3 + 4)");
    expect(logSpy).toHaveBeenCalledWith("14");

    run("10 - 4 / 2");
    expect(logSpy).toHaveBeenCalledWith("8");
  });

  it("evaluates string concatenation correctly", () => {
    run('"hello " + "world"');
    expect(logSpy).toHaveBeenCalledWith("hello world");
  });

  it("evaluates comparisons and equality correctly", () => {
    run("1 < 2");
    expect(logSpy).toHaveBeenCalledWith("true");

    run("2 >= 2");
    expect(logSpy).toHaveBeenCalledWith("true");

    run('"foo" == "foo"');
    expect(logSpy).toHaveBeenCalledWith("true");

    run('"foo" == "bar"');
    expect(logSpy).toHaveBeenCalledWith("false");
  });

  it("evaluates comma operator correctly", () => {
    run("1, 2, 3");
    expect(logSpy).toHaveBeenCalledWith("3");
  });

  it("evaluates ternary operator correctly", () => {
    run("true ? 1 : 2");
    expect(logSpy).toHaveBeenCalledWith("1");

    run("false ? 1 : 2");
    expect(logSpy).toHaveBeenCalledWith("2");
  });

  it("detects and reports runtime errors", () => {
    // Adding numbers and strings is a runtime error in Lox
    run('2 + "hello"');
    expect(Lox.hadRuntimeError).toBe(true);
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("Operands must be two numbers or two strings.")
    );

    // Negating a non-number is a runtime error
    logSpy.mockClear();
    Lox.hadRuntimeError = false;
    run('-"hello"');
    expect(Lox.hadRuntimeError).toBe(true);
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("Operand must be a number")
    );
  });
});
