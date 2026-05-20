import { readFile } from "node:fs/promises";
import { stdin, stdout } from "node:process";
import * as readline from "node:readline/promises";

export class Lox {
  static hadError = false;

  static async main(args: string[]): Promise<void> {
    if (args.length > 1) {
      console.log("Usage: tslox [script]");
      process.exit(64);
    } else if (args.length === 1) {
      await Lox.runFile(args[0]!);
    } else {
      await Lox.runPrompt();
    }
  }

  private static async runFile(path: string): Promise<void> {
    try {
      const contents = await readFile(path, "utf8");
      Lox.run(contents);

      if (Lox.hadError) {
        process.exit(65);
      }
    } catch (error: any) {
      console.error(`Error reading file: ${error.message}`);
      process.exit(1);
    }
  }

  private static async runPrompt(): Promise<void> {
    const rl = readline.createInterface({
      input: stdin,
      output: stdout,
      prompt: "> ",
    });

    rl.prompt();

    for await (const line of rl) {
      Lox.run(line);
      Lox.hadError = false; // Reset error state for interactive prompt
      rl.prompt();
    }
  }

  private static run(source: string): void {
    console.log(source);

    // TODO: Create scanner from source, scan tokens and print each token
    // const scanner = new Scanner(source);
    // const tokens: Token[] = scanner.scanTokens();

    // // For now, just print the tokens.
    // for (const token of tokens) {
    //   console.log(token);
    // }
  }

  static error(line: number, message: string): void {
    Lox.report(line, "", message);
  }

  private static report(line: number, where: string, message: string): void {
    console.error(`[line ${line}] Error${where}: ${message}`);
    Lox.hadError = true;
  }
}

// CLI entry point
const args = process.argv.slice(2);
Lox.main(args);
