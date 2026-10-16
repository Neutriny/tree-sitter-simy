/**
 * Tree-sitter grammar for Simy — a DSL for Minecraft datapack development.
 * @see https://github.com/Neutriny/tree-sitter-simy
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  member: 13,
  call: 12,
  unary: 11,
  mul: 10,
  add: 9,
  rel: 8,
  eq: 7,
  and: 6,
  or: 5,
  assign: 2,
};

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

function commaSep(rule) {
  return optional(commaSep1(rule));
}

module.exports = grammar({
  name: 'simy',

  extras: $ => [/\s/, $.line_comment, $.block_comment],

  // Makes keyword tokens win over `identifier` in ambiguous states.
  word: $ => $.identifier,

  // The NBT escape hatch is scanned by an external scanner so that balanced
  // braces (including nested compounds/lists and quoted strings) are captured
  // as a single token instead of colliding with block `{ ... }`.
  externals: $ => [$.nbt],

  conflicts: $ => [
    [$.command_statement, $._callable],
    [$.command_statement, $._primary],
    [$.command_argument, $._primary],
    [$.command_argument, $._expression],
    [$.command_argument, $._callable],
    [$.command_argument, $._primary, $.block_literal],
    [$.command_argument, $.block_literal],
    [$.block_literal, $._primary],
    [$.namespaced_identifier, $._primary],
  ],

  rules: {
    source_file: $ => repeat($.item),

    item: $ => choice(
      $.function_definition,
      $.component_definition,
      $._module_statement,
    ),

    // ─────────────────────────────── declarations ───────────────────────────
    const_declaration: $ => seq(
      'const', field('name', $._binding), '=',
      field('value', $._expression), ';'),

    let_declaration: $ => seq(
      'let', optional('mut'), field('name', $._binding),
      optional($.type_annotation), '=',
      field('value', $._expression), ';'),

    function_definition: $ => seq(
      'fn', field('name', $.identifier),
      field('parameters', $.parameter_list),
      optional(seq('->', field('return_type', $.type))),
      field('body', $.block)),

    parameter_list: $ => seq(
      '(', optional(seq(commaSep1($.parameter), optional(','))), ')'),

    parameter: $ => seq(
      field('name', $._binding), ':', field('type', $.type)),

    type_annotation: $ => seq(':', field('type', $.type)),

    // ─────────────────────────────── components ─────────────────────────────
    component_definition: $ => seq(
      'component', field('name', $.identifier),
      field('parameters', $.parameter_list),
      field('body', $.component_body)),

    component_body: $ => seq('{', repeat($.component_method), '}'),

    component_method: $ => seq(
      'tick', field('parameters', $.method_parameter_list), field('body', $.block)),

    method_parameter_list: $ => seq(
      '(', optional(seq(commaSep1($.method_parameter), optional(','))), ')'),

    // Component/tick method params use `Type name` order, e.g. `tick(entity self)`.
    method_parameter: $ => seq(
      field('type', $.type), field('name', $.identifier)),

    // ─────────────────────────────── types ──────────────────────────────────
    type: $ => choice(
      $.primitive_type,
      $.domain_type,
      $.generic_type,
      $.identifier),

    primitive_type: _ => choice('num', 'float', 'bool', 'str'),

    domain_type: _ => choice(
      'entity', 'selector', 'pos', 'vec3', 'block', 'item', 'team', 'tag', 'nbt'),

    generic_type: $ => seq(
      field('name', $.identifier), '<', commaSep1($.type), '>'),

    // ─────────────────────────────── statements ─────────────────────────────
    // Module level excludes `return_statement`, which makes `return` a
    // context-sensitive keyword: inside a block it is a return statement,
    // at the top level it falls back to an identifier (a `/return` command).
    _module_statement: $ => choice(
      $.let_declaration,
      $.const_declaration,
      $.assignment_statement,
      $.if_statement,
      $.for_statement,
      $.while_statement,
      $.execute_scope,
      $.expression_statement,
      $.command_statement,
      $.block),

    _block_statement: $ => choice(
      $._module_statement,
      $.return_statement),

    block: $ => seq('{', repeat($._block_statement), '}'),

    if_statement: $ => seq(
      'if', field('condition', $._expression), field('consequence', $.block),
      optional(seq(
        'else',
        field('alternative', choice($.if_statement, $.block))))),

    for_statement: $ => seq(
      'for', field('variable', $._binding), 'in',
      field('iterable', $._expression), field('body', $.block)),

    while_statement: $ => seq(
      'while', field('condition', $._expression), field('body', $.block)),

    return_statement: $ => seq('return', optional($._expression), ';'),

    // Structured replacement for native `execute` nesting.
    execute_scope: $ => seq(
      'execute', repeat1($.execute_verb), field('body', $.block)),

    execute_verb: $ => choice(
      seq('at', field('target', $.scope_target)),
      seq('as', field('target', $.scope_target)),
      seq('positioned', field('position', $.position))),

    // Restricted to a primary so that the closing `>` is never mistaken for a
    // comparison operator.
    scope_target: $ => seq('<', field('target', $._primary), '>'),

    assignment_statement: $ => prec.right(PREC.assign, seq(
      field('target', $._expression),
      field('operator', choice('=', '+=', '-=', '*=', '/=', '%=')),
      field('value', $._expression),
      ';')),

    expression_statement: $ => seq($._expression, ';'),

    // ─────────────────────────────── commands ───────────────────────────────
    command_statement: $ => seq(
      field('name', $.identifier),
      repeat1($.command_argument),
      optional($.argument_block),
      ';'),

    // Deliberately excludes anything starting with `(`, so that `foo(a)` is
    // always a call and `foo a b` is always a command.
    command_argument: $ => choice(
      $.selector,
      $.position,
      $.vector,
      $.block_literal,
      $.namespaced_identifier,
      $.nbt,
      $.variable_reference,
      $.string,
      $.number,
      $.boolean,
      $.call_expression,
      $.member_expression,
      $.identifier),

    argument_block: $ => seq(
      '(', commaSep1($.named_argument), optional(','), ')'),

    named_argument: $ => seq(
      field('name', $.identifier), ':', field('value', $._expression)),

    // ─────────────────────────────── expressions ────────────────────────────
    _expression: $ => choice(
      $.binary_expression,
      $.unary_expression,
      $.call_expression,
      $.member_expression,
      $.parenthesized_expression,
      $._primary),

    _primary: $ => choice(
      $.number,
      $.string,
      $.boolean,
      $.selector,
      $.position,
      $.vector,
      $.namespaced_identifier,
      $.variable_reference,
      $.block_literal,
      $.nbt,
      $.identifier),

    binary_expression: $ => choice(...[
      ['||', PREC.or],
      ['&&', PREC.and],
      ['==', PREC.eq],
      ['!=', PREC.eq],
      ['<=', PREC.rel],
      ['>=', PREC.rel],
      ['<', PREC.rel],
      ['>', PREC.rel],
      ['+', PREC.add],
      ['-', PREC.add],
      ['*', PREC.mul],
      ['/', PREC.mul],
      ['%', PREC.mul],
    ].map(([operator, precedence]) => prec.left(precedence, seq(
      field('left', $._expression),
      field('operator', operator),
      field('right', $._expression))))),

    unary_expression: $ => prec.right(PREC.unary, seq(
      field('operator', choice('!', '-', '+')),
      field('operand', $._expression))),

    call_expression: $ => prec(PREC.call, seq(
      field('function', $._callable),
      field('arguments', $.argument_list))),

    _callable: $ => choice($.identifier, $.member_expression),

    argument_list: $ => seq(
      '(', optional(seq(commaSep1($._expression), optional(','))), ')'),

    member_expression: $ => prec(PREC.member, seq(
      field('object', $._expression),
      '.',
      field('property', $.identifier))),

    parenthesized_expression: $ => seq('(', $._expression, ')'),

    // ────────────────────────── minecraft atoms ─────────────────────────────
    selector: $ => seq(
      field('marker', $.selector_marker),
      optional($.selector_arguments)),

    selector_marker: _ => token(choice('@a', '@e', '@p', '@r', '@s', '@n')),

    selector_arguments: $ => seq(
      '[', commaSep1($.selector_argument), optional(','), ']'),

    selector_argument: $ => seq(
      field('key', $.identifier),
      field('operator', choice('=', '!=')),
      field('value', $._selector_value)),

    _selector_value: $ => choice(
      $.namespaced_identifier,
      $.range,
      $.number,
      $.string,
      $.nbt,
      $.boolean,
      $.identifier),

    range: _ => token(seq(optional(/-?\d+/), '..', optional(/-?\d+/))),

    position: $ => seq($.coordinate, $.coordinate, $.coordinate),

    coordinate: _ => token(seq(
      choice('~', '^'), optional(/-?\d+(\.\d+)?/))),

    vector: $ => seq(
      '(', $._signed_number, ',', commaSep1($._signed_number), optional(','), ')'),

    _signed_number: $ => choice($.number, seq('-', $.number)),

    block_literal: $ => seq(
      field('name', $.namespaced_identifier),
      optional(seq('[', commaSep1($.block_state), optional(','), ']'))),

    block_state: $ => seq(
      field('key', $.identifier), '=',
      field('value', choice($.identifier, $.number, $.boolean))),

    // ─────────────────────────────── literals ───────────────────────────────
    number: _ => token(choice(/\d+/, /\d+\.\d+/)),

    boolean: _ => choice('true', 'false'),

    wildcard: _ => token(prec(1, '_')),

    _binding: $ => choice($.wildcard, $.identifier),

    namespaced_identifier: $ => seq(
      field('namespace', $.identifier), ':', field('name', $.identifier)),

    variable_reference: $ => seq('$', field('name', $.identifier)),

    string: $ => seq(
      '"',
      repeat(choice($.string_content, $.escape_sequence, $.interpolation)),
      '"'),

    string_content: _ => token.immediate(/[^"\\$]+/),

    escape_sequence: _ => token.immediate(seq('\\', /["\\$ntr]/)),

    interpolation: $ => choice(
      seq('$', '{', field('value', $._expression), '}'),
      seq('$', field('name', $.identifier))),

    // ─────────────────────────────── lexical ────────────────────────────────
    identifier: _ => /[A-Za-z_][A-Za-z0-9_]*/,

    line_comment: _ => token(seq('//', /[^\n]*/)),

    block_comment: _ => token(seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/')),
  }
});
