#include "tree_sitter/parser.h"

#include <stdbool.h>

// External tokens:
//  - NEWLINE: the statement terminator. Whether newlines are significant is
//    decided by the grammar: `_newline` only appears where a statement ends,
//    so inside brackets it is not a valid symbol and newlines there are
//    skipped as extras (implicit line joining).
//  - NBT: the raw-NBT escape hatch, a single balanced `{ ... }` token.
enum TokenType {
  NBT,
  NEWLINE,
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

  // External scanners are invoked before extras (whitespace) are skipped, so
  // consume leading spaces/tabs/CR here. Newlines themselves are significant.
  while (lexer->lookahead == ' ' || lexer->lookahead == '\t' ||
         lexer->lookahead == '\r') {
    lexer->advance(lexer, true);
  }

  if (valid_symbols[NEWLINE] && lexer->lookahead == '\n') {
    lexer->advance(lexer, false);
    lexer->result_symbol = NEWLINE;
    return true;
  }

  if (valid_symbols[NBT] && lexer->lookahead == '{') {
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

  return false;
}
