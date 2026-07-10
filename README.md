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

## Current Progress: Chapter 8 (Part 1 - Statements & State)

We have successfully built the front-end parser and the core execution engine of the interpreter. Here is a summary of the completed chapters and custom features:

1. **Scanning (Chapter 4):**
   - Implemented the `Scanner` to tokenize the Lox source code.
   - Emits tokens for single-character lexemes, operators, string/number literals, and reserved keywords.

2. **Representing Code & AST (Chapter 5):**
   - Manually defined the Abstract Syntax Tree (AST) nodes using TypeScript classes in [src/Expr.ts](file:///Users/chiua/projects/books/tslox/src/Expr.ts).
   - Implemented the **Visitor Pattern** for type-safe double dispatch.
   - Built [src/AstPrinter.ts](file:///Users/chiua/projects/books/tslox/src/AstPrinter.ts) to verify AST structures in LISP-style.

3. **Parsing Expressions (Chapter 6):**
   - Implemented a recursive descent `Parser` in [src/Parser.ts](file:///Users/chiua/projects/books/tslox/src/Parser.ts).
   - **Challenge 1:** Added the comma binary operator `,` (lowest precedence, left-associative).
   - **Challenge 2:** Added the conditional ternary operator `?:` (right-associative, with full expression support in the middle branch).
   - **Challenge 3:** Added error production rules for missing left-hand operands to recover gracefully from leading binary operators (e.g. `+ 2 * 3;`) without crashing the parser.

4. **Evaluating Expressions (Chapter 7):**
   - Built the `Interpreter` class in [src/Interpreter.ts](file:///Users/chiua/projects/books/tslox/src/Interpreter.ts) to evaluate AST nodes at runtime.
   - Implemented the custom [src/RuntimeError.ts](file:///Users/chiua/projects/books/tslox/src/RuntimeError.ts) type to report runtime issues (like negating non-numbers) with source code line numbers.
   - **Challenge:** Extended `+` to support JavaScript-style implicit string coercion (e.g., `"hello"` + 2 and `2 + "hello"` both evaluate to string concatenation).

5. **Statements & State (Chapter 8 - Part 1):**
   - Created statement AST definitions (`Print`, `Expression`, `Var`) in [src/Stmt.ts](file:///Users/chiua/projects/books/tslox/src/Stmt.ts).
   - Upgraded the parser (`parse()`) to output a program list of statements (`Stmt[]`) instead of a single expression.
   - Upgraded the interpreter (`interpret()`) to execute statement blocks and handle errors on a statement-by-statement basis.

### Next Step

Implementing **Environments** in Chapter 8 to store variable bindings and enable stateful execution.

https://craftinginterpreters.com/statements-and-state.html#scope
