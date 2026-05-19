class Lox {
  static main() {
    if (process.argv.length > 1) {
      console.log("Usage: jlox [script]");
    } else if (process.argv[1]) {
      // runFile(args[0]);
    } else {
      // runPrompt
    }
  }
}
