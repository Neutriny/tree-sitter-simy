# tree-sitter-simy

[English](README.md) | **简体中文**

> 面向 **Simy**（Minecraft 数据包开发 DSL）的 Tree-sitter 语法。

本语法是 **Simy 语法的唯一事实源** —— 编译器与编辑器扩展都消费它。
参见[语言参考](https://github.com/Neutriny/zed-simy/blob/main/docs/syntax.zh-CN.md)。

## 覆盖范围

- 声明：`let` / `mut` / `const`、类型注解、三层类型系统。
- 函数（`->` 返回类型）与 `component` 定义（含 `tick` 方法）。
- 控制流：`if` / `else`、`while`、`for … in`、`return`，以及结构化的
  `execute at <target> { … }` 作用域。
- 命令作为结构化语句：`foo(a)` 恒为调用，`foo a b` 恒为命令。
- Minecraft 原子：选择器（`@e[type=zombie]`）、坐标（`~ ~1 ~`）、向量
  （`(0.5, 1.0, -0.2)`）、命名空间 ID、方块状态，以及原始 `nbt` 逃生舱。
- 字符串内插（`$name`、`${ expr }`）与裸 `$name` 引用。
- 上下文关键字：`tick`、`return` 与类型名只在各自位置生效，透传命令词不受影响。

## 用法

```sh
npm install
npx tree-sitter generate
npx tree-sitter test
npx tree-sitter parse examples/example.simy
```

## 查询文件

| 文件 | 用途 |
| :--- | :--- |
| `queries/highlights.scm` | 语法高亮 |
| `queries/brackets.scm` | 括号匹配 |
| `queries/indents.scm` | 自动缩进 |
| `queries/folds.scm` | 代码折叠 |
| `queries/outline.scm` | 文档符号 |
| `queries/locals.scm` | 局部作用域 |

## 仓库结构

```
grammar.js          语法定义（JavaScript DSL）
src/parser.c        生成的解析器（勿手改）
src/scanner.c       手写外部扫描器（原始 NBT）
src/tree_sitter/    运行时头文件（勿手改）
queries/            编辑器查询
test/corpus/        corpus 测试
examples/           示例 .simy 文件
```

> 修改 `grammar.js` 后需运行 `npx tree-sitter generate` 并**提交 `src/parser.c`** ——
> 消费方会直接编译它。不要手改 `parser.c`、`grammar.json`、`node-types.json` 或
> `src/tree_sitter/*.h`。

## 编辑器

- **Zed**：[zed-simy](https://github.com/Neutriny/zed-simy)

## 相关项目

| 仓库 | 作用 |
| :--- | :--- |
| **[simy](https://github.com/Neutriny/simy)** | 编译器与 CLI |
| **[zed-simy](https://github.com/Neutriny/zed-simy)** | Zed 编辑器扩展 |

## 许可证

MIT
