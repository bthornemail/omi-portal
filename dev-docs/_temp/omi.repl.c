/*
 * OMI C Bitwise REPL v0
 *
 * Goal:
 *   A tiny portable meta-circular-ish CONS runtime in C.
 *   Arithmetic layer uses bitwise operations only.
 *
 * Build:
 *   cc -std=c99 -Wall -Wextra -O2 omi.c -o omi
 *
 * Run:
 *   ./omi
 *
 * Forms:
 *   atoms:        numbers, nil, t, symbols
 *   quote:        'x
 *   cons:         (cons a b)
 *   car/cdr:      (car x), (cdr x)
 *   eq:           (eq a b)
 *   bit ops:      (band a b), (bor a b), (bxor a b), (bnot a), (shl a b), (shr a b)
 *   arithmetic:   (badd a b), (bsub a b)
 *   define:       (define name expr)
 *
 * Notes:
 *   This is intentionally small. The next stage is lambda + env closures.
 */

#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

#define HEAP_MAX 65536
#define SYM_MAX  1024
#define ENV_MAX  1024
#define TOK_MAX  256

typedef uint32_t Omi;

/* Tag layout:
 * low 2 bits:
 *   00 = NIL / false / null
 *   01 = integer immediate
 *   10 = symbol immediate
 *   11 = cons pointer
 */
#define TAG_NIL  0u
#define TAG_INT  1u
#define TAG_SYM  2u
#define TAG_CONS 3u
#define TAG_MASK 3u

#define NIL ((Omi)0)
#define TRUE make_sym("t")

typedef struct {
    Omi car;
    Omi cdr;
} Cell;

typedef struct {
    char name[64];
} Symbol;

typedef struct {
    Omi sym;
    Omi val;
} Binding;

static Cell heap[HEAP_MAX];
static uint32_t hp = 1; /* cons index 0 reserved */

static Symbol syms[SYM_MAX];
static uint32_t sym_count = 0;

static Binding env[ENV_MAX];
static uint32_t env_count = 0;

/* Bitwise-only unsigned add. */
static uint32_t uadd(uint32_t a, uint32_t b) {
    while (b) {
        uint32_t carry = a & b;
        a = a ^ b;
        b = carry << 1;
    }
    return a;
}

/* Bitwise-only two's complement negation. */
static uint32_t uneg(uint32_t x) {
    return uadd(~x, 1u);
}

/* Bitwise-only unsigned subtraction a - b. */
static uint32_t usub(uint32_t a, uint32_t b) {
    return uadd(a, uneg(b));
}

static Omi make_int(uint32_t x) {
    return (x << 2) | TAG_INT;
}

static uint32_t as_int(Omi x) {
    return x >> 2;
}

static int is_int(Omi x) {
    return (x & TAG_MASK) == TAG_INT;
}

static int is_sym(Omi x) {
    return (x & TAG_MASK) == TAG_SYM;
}

static int is_cons(Omi x) {
    return (x & TAG_MASK) == TAG_CONS;
}

static uint32_t sym_index(Omi x) {
    return x >> 2;
}

static Omi make_sym(const char *name) {
    for (uint32_t i = 0; i < sym_count; i++) {
        if (strcmp(syms[i].name, name) == 0) {
            return (i << 2) | TAG_SYM;
        }
    }
    if (sym_count >= SYM_MAX) {
        fprintf(stderr, "symbol table full\n");
        exit(1);
    }
    snprintf(syms[sym_count].name, sizeof(syms[sym_count].name), "%s", name);
    return (sym_count++ << 2) | TAG_SYM;
}

static const char *sym_name(Omi s) {
    return syms[sym_index(s)].name;
}

static Omi cons(Omi a, Omi d) {
    if (hp >= HEAP_MAX) {
        fprintf(stderr, "heap full\n");
        exit(1);
    }
    heap[hp].car = a;
    heap[hp].cdr = d;
    return (hp++ << 2) | TAG_CONS;
}

static uint32_t cons_index(Omi x) {
    return x >> 2;
}

static Omi car(Omi x) {
    if (!is_cons(x)) return NIL;
    return heap[cons_index(x)].car;
}

static Omi cdr(Omi x) {
    if (!is_cons(x)) return NIL;
    return heap[cons_index(x)].cdr;
}

static void env_set(Omi sym, Omi val) {
    for (uint32_t i = 0; i < env_count; i++) {
        if (env[i].sym == sym) {
            env[i].val = val;
            return;
        }
    }
    if (env_count >= ENV_MAX) {
        fprintf(stderr, "environment full\n");
        exit(1);
    }
    env[env_count].sym = sym;
    env[env_count].val = val;
    env_count++;
}

static Omi env_get(Omi sym) {
    for (uint32_t i = 0; i < env_count; i++) {
        if (env[i].sym == sym) return env[i].val;
    }
    return sym; /* self-evaluating unknown symbol for now */
}

/* Reader */

typedef struct {
    const char *s;
    size_t i;
} Reader;

static void skip_ws(Reader *r) {
    while (r->s[r->i] && isspace((unsigned char)r->s[r->i])) r->i++;
}

static int peek(Reader *r) {
    skip_ws(r);
    return r->s[r->i];
}

static int getc_r(Reader *r) {
    return r->s[r->i++];
}

static Omi read_expr(Reader *r);

static Omi read_list(Reader *r) {
    skip_ws(r);
    if (peek(r) == ')') {
        getc_r(r);
        return NIL;
    }

    Omi first = read_expr(r);
    skip_ws(r);

    if (peek(r) == '.') {
        getc_r(r);
        Omi second = read_expr(r);
        skip_ws(r);
        if (peek(r) == ')') getc_r(r);
        return cons(first, second);
    }

    Omi rest = read_list(r);
    return cons(first, rest);
}

static Omi read_atom(Reader *r) {
    char tok[TOK_MAX];
    size_t n = 0;

    skip_ws(r);
    while (r->s[r->i] &&
           !isspace((unsigned char)r->s[r->i]) &&
           r->s[r->i] != '(' &&
           r->s[r->i] != ')' &&
           r->s[r->i] != '\'') {
        if (n + 1 < TOK_MAX) tok[n++] = r->s[r->i];
        r->i++;
    }
    tok[n] = 0;

    if (strcmp(tok, "nil") == 0) return NIL;

    int numeric = tok[0] != 0;
    size_t start = 0;
    if (tok[0] == '-') start = 1;
    for (size_t j = start; tok[j]; j++) {
        if (!isdigit((unsigned char)tok[j])) {
            numeric = 0;
            break;
        }
    }

    if (numeric) {
        uint32_t v = 0;
        for (size_t j = start; tok[j]; j++) {
            v = uadd((v << 3), (v << 1)); /* v * 10 via shifts/add */
            v = uadd(v, (uint32_t)(tok[j] - '0'));
        }
        if (tok[0] == '-') v = uneg(v);
        return make_int(v);
    }

    return make_sym(tok);
}

static Omi read_expr(Reader *r) {
    skip_ws(r);
    int c = peek(r);

    if (c == 0) return NIL;

    if (c == '\'') {
        getc_r(r);
        Omi q = make_sym("quote");
        Omi x = read_expr(r);
        return cons(q, cons(x, NIL));
    }

    if (c == '(') {
        getc_r(r);
        return read_list(r);
    }

    return read_atom(r);
}

/* Printer */

static void print_omi(Omi x);

static void print_list(Omi x) {
    while (is_cons(x)) {
        print_omi(car(x));
        x = cdr(x);
        if (x != NIL) {
            if (is_cons(x)) printf(" ");
            else {
                printf(" . ");
                print_omi(x);
                break;
            }
        }
    }
}

static void print_omi(Omi x) {
    if (x == NIL) {
        printf("nil");
    } else if (is_int(x)) {
        printf("%u", as_int(x));
    } else if (is_sym(x)) {
        printf("%s", sym_name(x));
    } else if (is_cons(x)) {
        printf("(");
        print_list(x);
        printf(")");
    } else {
        printf("#<bad:%u>", x);
    }
}

/* Eval */

static Omi eval(Omi x);

static Omi eval_list_1(Omi args) {
    return eval(car(args));
}

static Omi eval_list_2a(Omi args) {
    return eval(car(args));
}

static Omi eval_list_2b(Omi args) {
    return eval(car(cdr(args)));
}

static Omi apply_builtin(Omi op, Omi args) {
    const char *name = sym_name(op);

    if (strcmp(name, "quote") == 0) return car(args);

    if (strcmp(name, "define") == 0) {
        Omi sym = car(args);
        Omi val = eval(car(cdr(args)));
        if (is_sym(sym)) env_set(sym, val);
        return sym;
    }

    if (strcmp(name, "cons") == 0) return cons(eval_list_2a(args), eval_list_2b(args));
    if (strcmp(name, "car")  == 0) return car(eval_list_1(args));
    if (strcmp(name, "cdr")  == 0) return cdr(eval_list_1(args));

    if (strcmp(name, "eq") == 0) {
        Omi a = eval_list_2a(args);
        Omi b = eval_list_2b(args);
        return a == b ? TRUE : NIL;
    }

    if (strcmp(name, "band") == 0) return make_int(as_int(eval_list_2a(args)) & as_int(eval_list_2b(args)));
    if (strcmp(name, "bor")  == 0) return make_int(as_int(eval_list_2a(args)) | as_int(eval_list_2b(args)));
    if (strcmp(name, "bxor") == 0) return make_int(as_int(eval_list_2a(args)) ^ as_int(eval_list_2b(args)));
    if (strcmp(name, "bnot") == 0) return make_int(~as_int(eval_list_1(args)));
    if (strcmp(name, "shl")  == 0) return make_int(as_int(eval_list_2a(args)) << (as_int(eval_list_2b(args)) & 31u));
    if (strcmp(name, "shr")  == 0) return make_int(as_int(eval_list_2a(args)) >> (as_int(eval_list_2b(args)) & 31u));

    if (strcmp(name, "badd") == 0) return make_int(uadd(as_int(eval_list_2a(args)), as_int(eval_list_2b(args))));
    if (strcmp(name, "bsub") == 0) return make_int(usub(as_int(eval_list_2a(args)), as_int(eval_list_2b(args))));

    printf("unknown op: %s\n", name);
    return NIL;
}

static Omi eval(Omi x) {
    if (x == NIL || is_int(x)) return x;
    if (is_sym(x)) return env_get(x);

    Omi op = car(x);
    Omi args = cdr(x);

    if (is_sym(op)) return apply_builtin(op, args);

    op = eval(op);
    if (is_sym(op)) return apply_builtin(op, args);

    return NIL;
}

static void init_env(void) {
    env_set(make_sym("nil"), NIL);
    env_set(make_sym("t"), TRUE);
}

int main(void) {
    init_env();

    puts("OMI C Bitwise REPL v0");
    puts("Type forms like: (cons 1 2), '(a . b), (badd 40 2), (band 15 3)");
    puts("Ctrl-D to exit.");

    char line[4096];

    for (;;) {
        printf("omi> ");
        fflush(stdout);

        if (!fgets(line, sizeof(line), stdin)) {
            printf("\n");
            break;
        }

        Reader r = { line, 0 };
        Omi expr = read_expr(&r);
        Omi out = eval(expr);
        print_omi(out);
        printf("\n");
    }

    return 0;
}
