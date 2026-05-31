# TSLox

A TypeScript implementation of the Lox programming language.

## Getting Started

### Installation

```bash
npm install
```

## Tooling

This project uses the high-performance [Oxc](https://oxc.rs/) toolchain for linting and formatting, providing near-instant feedback.

### Linting

To check for code quality issues and potential bugs:

```bash
npm run lint
```

### Formatting

To automatically format your code according to standard conventions:

```bash
npm run format
```

### Development

To compile the TypeScript code:

```bash
npx tsc
```

## Notes

We have built the REPL command to read the source file. This takes the file path

> Lox.ts <filepath>

or without any argument it will open an interactive prompt.

It reads the content of the file, creates a scanner class with the file contents, and scans the tokens.

We have built the the Scanner class. This takes the source code, iterates through the Lexemes and builds the list of tokens.

We have defined the grammar rules of our language and implemented the expression rule as classes using the visitor pattern.

https://craftinginterpreters.com/representing-code.html

Next: This list of tokens will feed into the Parser, which builds the abstract syntax tree.

```
[ Source Code ]  --> Raw text (e.g., "var average = 5;")
       ↓
 1. SCANNER (Lexer)  <-- Consumes characters, groups them into Tokens
       ↓
   [ Tokens ]     --> Structured packets of data (The Token class!)
       ↓
 2. PARSER        <-- Consumes tokens, groups them into an AST
       ↓
[ Syntax Tree ]   --> Hierarchical representation of program logic
       ↓
 3. INTERPRETER   <-- Executes the AST (or Compiler emits bytecode)
```
