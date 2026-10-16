#include "tree_sitter/parser.h"

#include <stdbool.h>

// The only external token is the NBT escape hatch. It captures a balanced
// `{ ... }` region (nested compounds/lists and quoted strings included) as a
// single opaque token, so raw NBT never collides with block `{ ... }` syntax.
enum TokenType {
  NBT,
};

void *tree_sitter_simy_external_scanner_create(void) {
  return NULL;
}

void tree_sitter_simy_external_scanner_destroy(void *payload) {
  (void)payload;
}

void tree_sitter_simy_external_scanner_reset(void *payload) {
  (void)payload;
}

unsigned tree_sitter_simy_external_scanner_serialize(void *payload, char *buffer) {
  (void)payload;
  (void)buffer;
  return 0;
}

void tree_sitter_simy_external_scanner_deserialize(void *payload, const char *buffer,
                                                   unsigned length) {
  (void)payload;
  (void)buffer;
  (void)length;
}

bool tree_sitter_simy_external_scanner_scan(void *payload, TSLexer *lexer,
                                            const bool *valid_symbols) {
  (void)payload;

  if (!valid_symbols[NBT]) {
    return false;
  }

  // External scanners are invoked before extras (whitespace) are skipped, so
  // consume leading spaces/tabs here. Newlines are significant (statement
  // terminators) and must NOT be consumed.
  while (lexer->lookahead == ' ' || lexer->lookahead == '\t' ||
         lexer->lookahead == '\r') {
    lexer->advance(lexer, true);
  }

  if (lexer->lookahead != '{') {
    return false;
  }

  int depth = 0;
  int quote = 0; // 0 = none, otherwise '\'' or '"'
  bool escaped = false;

  while (lexer->lookahead != 0) {
    int c = lexer->lookahead;

    if (quote != 0) {
      if (escaped) {
        escaped = false;
      } else if (c == '\\') {
        escaped = true;
      } else if (c == quote) {
        quote = 0;
      }
      lexer->advance(lexer, false);
      continue;
    }

    if (c == '\'' || c == '"') {
      quote = c;
      lexer->advance(lexer, false);
      continue;
    }

    if (c == '{') {
      depth++;
      lexer->advance(lexer, false);
      continue;
    }

    if (c == '}') {
      depth--;
      lexer->advance(lexer, false);
      if (depth == 0) {
        lexer->result_symbol = NBT;
        return true;
      }
      continue;
    }

    lexer->advance(lexer, false);
  }

  return false;
}
