# tree-sitter-simy

**English** | [简体中文](README.zh-CN.md)

> Tree-sitter grammar for **Simy**, a DSL for Minecraft datapack development.

This grammar is the **single source of truth for Simy syntax** — the compiler and the
editor extension both consume it. See the
[language reference](https://github.com/Neutriny/zed-simy/blob/main/docs/syntax.md) (English)
/ [语法参考](https://github.com/Neutriny/zed-simy/blob/main/docs/syntax.zh-CN.md) (简体中文).

## What it covers

- Declarations: `let` / `mut` / `const`, type annotations, three-layer type system.
- Functions with `->` return types, and `component` definitions with `tick` methods.
- Control flow: `if` / `else`, `while`, `for … in`, `return`, and the structured
  `execute at <target> { … }` scope.
- Commands as structured statements: `foo(a)` is always a call, `foo a b` is always a
  command.
- Minecraft atoms: selectors (`@e[type=zombie]`), coordinates (`~ ~1 ~`), vectors
  (`(0.5, 1.0, -0.2)`), namespaced IDs, block states, and the raw-`nbt` escape hatch.
- String interpolation (`$name`, `${ expr }`) and bare `$name` references.
- Context-sensitive keywords: `tick`, `return` and type names only act as keywords in
  their own positions, so passthrough command words stay usable.

## Usage

```sh
npm install
npx tree-sitter generate
npx tree-sitter test
npx tree-sitter parse examples/example.simy
```

## Queries

| File | Purpose |
| :--- | :--- |
| `queries/highlights.scm` | syntax highlighting |
| `queries/brackets.scm` | bracket matching |
| `queries/indents.scm` | auto-indentation |
| `queries/folds.scm` | code folding |
| `queries/outline.scm` | document symbols |
| `queries/locals.scm` | local scope tracking |

## Repository layout

```
grammar.js          grammar definition (JavaScript DSL)
src/parser.c        generated parser (do not edit)
src/scanner.c       hand-written external scanner (raw NBT)
src/tree_sitter/    runtime headers (do not edit)
queries/            editor queries
test/corpus/        corpus tests
examples/           example .simy files
```

> After editing `grammar.js`, run `npx tree-sitter generate` and **commit `src/parser.c`** —
> consumers compile it directly. Do not edit `parser.c`, `grammar.json`, `node-types.json`
> or `src/tree_sitter/*.h` by hand.

## Editors

- **Zed**: [zed-simy](https://github.com/Neutriny/zed-simy)

## Related projects

| Repository | Role |
| :--- | :--- |
| **[simy](https://github.com/Neutriny/Simy)** | Compiler and CLI |
| **[zed-simy](https://github.com/Neutriny/zed-simy)** | Zed editor extension |

## License

MIT
