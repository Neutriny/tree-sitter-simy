# tree-sitter-simy

Tree-sitter grammar for **Simy**, a DSL for Minecraft datapack development that
compiles to `mcfunction` and JSON. See the [syntax reference](https://github.com/Neutriny/zed-simy/blob/main/docs/syntax.md).

## Features

- Full grammar for declarations, functions, components, control flow and the
  structured `execute` scope.
- First-class Minecraft atoms: selectors, coordinates/vectors, namespaced IDs,
  block states and the raw-`nbt` escape hatch (via an external scanner).
- String interpolation: `$name` and `${ expr }`, plus bare `$name` references.
- Context-sensitive keywords: `tick` / `return` / type names only act as
  keywords in their own positions, so any passthrough command word stays usable.
- Queries for highlighting, brackets, indentation, folding, outline and locals.

## Using the grammar

```sh
npm install
npx tree-sitter generate
npx tree-sitter test
```

Parse a file:

```sh
npx tree-sitter parse examples/example.simy
```

## Editors

The `queries/` directory contains:

| File | Purpose |
| :--- | :--- |
| `highlights.scm` | syntax highlighting |
| `brackets.scm` | bracket matching |
| `indents.scm` | auto-indentation |
| `folds.scm` | code folding |
| `outline.scm` | document symbols |
| `locals.scm` | local scope tracking |

The Zed extension lives at [Neutriny/zed-simy](https://github.com/Neutriny/zed-simy).

## License

MIT
