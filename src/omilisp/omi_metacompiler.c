#include <ctype.h>
#include <errno.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>

#define OMI_FS 0x1cu
#define OMI_GS 0x1du
#define OMI_RS 0x1eu
#define OMI_US 0x1fu

#define STATE_CANONICAL 0x01u
#define STATE_ALIST 0x02u

typedef enum {
    NODE_ATOM,
    NODE_STRING,
    NODE_LIST,
    NODE_PAIR
} NodeKind;

typedef struct Node Node;

struct Node {
    NodeKind kind;
    char *text;
    Node **items;
    size_t count;
    size_t cap;
    Node *car;
    Node *cdr;
};

typedef struct {
    char *data;
    size_t len;
    size_t cap;
} Buffer;

typedef struct {
    unsigned char lane;
    char *value;
} Event;

typedef struct {
    Event *items;
    size_t len;
    size_t cap;
} EventList;

typedef struct {
    const char *src;
    size_t len;
    size_t pos;
    int line;
    int col;
    char error[256];
} Parser;

typedef struct {
    Node *root;
    char *normalized;
    char shape[16];
    unsigned char state;
    EventList events;
    Buffer tape;
    uint64_t source_hash;
    uint64_t normalized_hash;
    uint64_t tape_hash;
} Compilation;

static void die(const char *message)
{
    fprintf(stderr, "%s\n", message);
    exit(1);
}

static void *xmalloc(size_t n)
{
    void *p = malloc(n ? n : 1);
    if (!p) die("out of memory");
    return p;
}

static void *xrealloc(void *ptr, size_t n)
{
    void *p = realloc(ptr, n ? n : 1);
    if (!p) die("out of memory");
    return p;
}

static char *xstrdup(const char *s)
{
    size_t n = strlen(s);
    char *out = (char *)xmalloc(n + 1);
    memcpy(out, s, n + 1);
    return out;
}

static char *xstrndup(const char *s, size_t n)
{
    char *out = (char *)xmalloc(n + 1);
    memcpy(out, s, n);
    out[n] = '\0';
    return out;
}

static void buffer_reserve(Buffer *b, size_t extra)
{
    size_t need = b->len + extra + 1;
    if (need <= b->cap) return;
    size_t cap = b->cap ? b->cap : 128;
    while (cap < need) cap *= 2;
    b->data = (char *)xrealloc(b->data, cap);
    b->cap = cap;
}

static void buffer_putc(Buffer *b, unsigned char c)
{
    buffer_reserve(b, 1);
    b->data[b->len++] = (char)c;
    b->data[b->len] = '\0';
}

static void buffer_append(Buffer *b, const char *s)
{
    size_t n = strlen(s);
    buffer_reserve(b, n);
    memcpy(b->data + b->len, s, n);
    b->len += n;
    b->data[b->len] = '\0';
}

static void buffer_append_bytes(Buffer *b, const unsigned char *bytes, size_t n)
{
    buffer_reserve(b, n);
    memcpy(b->data + b->len, bytes, n);
    b->len += n;
    b->data[b->len] = '\0';
}

static void buffer_free(Buffer *b)
{
    free(b->data);
    b->data = NULL;
    b->len = 0;
    b->cap = 0;
}

static Node *node_new(NodeKind kind)
{
    Node *n = (Node *)xmalloc(sizeof(Node));
    n->kind = kind;
    n->text = NULL;
    n->items = NULL;
    n->count = 0;
    n->cap = 0;
    n->car = NULL;
    n->cdr = NULL;
    return n;
}

static Node *node_atom(const char *text)
{
    Node *n = node_new(NODE_ATOM);
    n->text = xstrdup(text);
    return n;
}

static Node *node_string(const char *text)
{
    Node *n = node_new(NODE_STRING);
    n->text = xstrdup(text);
    return n;
}

static Node *node_pair(Node *car, Node *cdr)
{
    Node *n = node_new(NODE_PAIR);
    n->car = car;
    n->cdr = cdr;
    return n;
}

static void node_list_push(Node *list, Node *item)
{
    if (list->count == list->cap) {
        size_t cap = list->cap ? list->cap * 2 : 8;
        list->items = (Node **)xrealloc(list->items, cap * sizeof(Node *));
        list->cap = cap;
    }
    list->items[list->count++] = item;
}

static void node_free(Node *n)
{
    size_t i;
    if (!n) return;
    free(n->text);
    if (n->kind == NODE_LIST) {
        for (i = 0; i < n->count; i++) node_free(n->items[i]);
        free(n->items);
    } else if (n->kind == NODE_PAIR) {
        node_free(n->car);
        node_free(n->cdr);
    }
    free(n);
}

static int parser_set_error(Parser *p, const char *message)
{
    snprintf(p->error, sizeof(p->error), "%s at line %d, col %d", message, p->line, p->col);
    return 0;
}

static int parser_done(Parser *p)
{
    return p->pos >= p->len;
}

static char parser_peek(Parser *p)
{
    return parser_done(p) ? '\0' : p->src[p->pos];
}

static char parser_next(Parser *p)
{
    char c = parser_done(p) ? '\0' : p->src[p->pos++];
    if (c == '\n') {
        p->line++;
        p->col = 1;
    } else {
        p->col++;
    }
    return c;
}

static void parser_skip_ws(Parser *p)
{
    while (!parser_done(p)) {
        char c = parser_peek(p);
        if (c == ' ' || c == '\t' || c == '\r' || c == '\n') {
            parser_next(p);
        } else if (c == ';') {
            while (!parser_done(p) && parser_peek(p) != '\n') parser_next(p);
        } else {
            break;
        }
    }
}

static int is_atom_delim(char c)
{
    return c == '\0' || c == '(' || c == ')' || c == '"' ||
        c == ';' || isspace((unsigned char)c);
}

static int is_isolated_dot(Parser *p)
{
    char next;
    if (parser_peek(p) != '.') return 0;
    next = (p->pos + 1 < p->len) ? p->src[p->pos + 1] : '\0';
    return is_atom_delim(next);
}

static Node *parse_expr(Parser *p);

static Node *build_dotted_tail(Node *list, Node *cdr)
{
    Node *tail = cdr;
    while (list->count > 0) {
        tail = node_pair(list->items[--list->count], tail);
    }
    free(list->items);
    free(list);
    return tail;
}

static Node *parse_list(Parser *p)
{
    Node *list;
    parser_next(p);
    list = node_new(NODE_LIST);

    while (!parser_done(p)) {
        parser_skip_ws(p);
        if (parser_peek(p) == ')') {
            parser_next(p);
            return list;
        }
        if (is_isolated_dot(p)) {
            Node *cdr;
            if (list->count == 0) {
                node_free(list);
                parser_set_error(p, "dotted pair missing car");
                return NULL;
            }
            parser_next(p);
            cdr = parse_expr(p);
            if (!cdr) {
                node_free(list);
                return NULL;
            }
            parser_skip_ws(p);
            if (parser_peek(p) != ')') {
                node_free(list);
                node_free(cdr);
                parser_set_error(p, "dotted pair missing closing paren");
                return NULL;
            }
            parser_next(p);
            return build_dotted_tail(list, cdr);
        }
        {
            Node *item = parse_expr(p);
            if (!item) {
                node_free(list);
                return NULL;
            }
            node_list_push(list, item);
        }
    }

    node_free(list);
    parser_set_error(p, "unterminated list");
    return NULL;
}

static Node *parse_string(Parser *p)
{
    Buffer out = {0};
    parser_next(p);
    while (!parser_done(p) && parser_peek(p) != '"') {
        char c = parser_next(p);
        if (c == '\\' && !parser_done(p)) {
            char e = parser_next(p);
            if (e == 'n') buffer_putc(&out, '\n');
            else if (e == 't') buffer_putc(&out, '\t');
            else if (e == 'r') buffer_putc(&out, '\r');
            else buffer_putc(&out, (unsigned char)e);
        } else {
            buffer_putc(&out, (unsigned char)c);
        }
    }
    if (parser_peek(p) != '"') {
        buffer_free(&out);
        parser_set_error(p, "unterminated string");
        return NULL;
    }
    parser_next(p);
    {
        Node *n = node_string(out.data ? out.data : "");
        buffer_free(&out);
        return n;
    }
}

static Node *parse_atom(Parser *p)
{
    size_t start = p->pos;
    while (!parser_done(p) && !is_atom_delim(parser_peek(p))) {
        parser_next(p);
    }
    if (p->pos == start) {
        parser_set_error(p, "empty atom");
        return NULL;
    }
    {
        char *text = xstrndup(p->src + start, p->pos - start);
        Node *n = node_atom(text);
        free(text);
        return n;
    }
}

static Node *parse_expr(Parser *p)
{
    parser_skip_ws(p);
    if (parser_done(p)) {
        parser_set_error(p, "missing expression");
        return NULL;
    }
    if (parser_peek(p) == '(') return parse_list(p);
    if (parser_peek(p) == ')') {
        parser_set_error(p, "unexpected closing paren");
        return NULL;
    }
    if (parser_peek(p) == '"') return parse_string(p);
    return parse_atom(p);
}

static Node *parse_source(const char *source, char *error, size_t error_len)
{
    Parser p;
    Node *root;
    p.src = source;
    p.len = strlen(source);
    p.pos = 0;
    p.line = 1;
    p.col = 1;
    p.error[0] = '\0';

    root = parse_expr(&p);
    if (!root) {
        snprintf(error, error_len, "%s", p.error);
        return NULL;
    }
    parser_skip_ws(&p);
    if (!parser_done(&p)) {
        node_free(root);
        parser_set_error(&p, "unexpected trailing content");
        snprintf(error, error_len, "%s", p.error);
        return NULL;
    }
    return root;
}

static void append_json_escaped(Buffer *b, const char *s)
{
    const unsigned char *p = (const unsigned char *)s;
    while (*p) {
        unsigned char c = *p++;
        if (c == '"' || c == '\\') {
            buffer_putc(b, '\\');
            buffer_putc(b, c);
        } else if (c == '\n') {
            buffer_append(b, "\\n");
        } else if (c == '\r') {
            buffer_append(b, "\\r");
        } else if (c == '\t') {
            buffer_append(b, "\\t");
        } else if (c < 0x20) {
            char tmp[8];
            snprintf(tmp, sizeof(tmp), "\\u%04x", c);
            buffer_append(b, tmp);
        } else {
            buffer_putc(b, c);
        }
    }
}

static void node_append_canonical(Node *n, Buffer *b);

static void node_append_string(Node *n, Buffer *b)
{
    buffer_putc(b, '"');
    append_json_escaped(b, n->text ? n->text : "");
    buffer_putc(b, '"');
}

static void node_append_canonical(Node *n, Buffer *b)
{
    size_t i;
    if (!n) {
        buffer_append(b, "nil");
        return;
    }
    if (n->kind == NODE_ATOM) {
        buffer_append(b, n->text ? n->text : "");
    } else if (n->kind == NODE_STRING) {
        node_append_string(n, b);
    } else if (n->kind == NODE_LIST) {
        buffer_putc(b, '(');
        for (i = 0; i < n->count; i++) {
            if (i) buffer_putc(b, ' ');
            node_append_canonical(n->items[i], b);
        }
        buffer_putc(b, ')');
    } else if (n->kind == NODE_PAIR) {
        buffer_putc(b, '(');
        node_append_canonical(n->car, b);
        buffer_append(b, " . ");
        node_append_canonical(n->cdr, b);
        buffer_putc(b, ')');
    }
}

static char *node_to_label(Node *n)
{
    Buffer b = {0};
    if (!n) return xstrdup("");
    if ((n->kind == NODE_ATOM || n->kind == NODE_STRING) && n->text) {
        return xstrdup(n->text);
    }
    node_append_canonical(n, &b);
    return b.data ? b.data : xstrdup("");
}

static int atom_is(Node *n, const char *text)
{
    return n && n->kind == NODE_ATOM && n->text && strcmp(n->text, text) == 0;
}

static int lane_from_atom(Node *n, unsigned char *lane)
{
    if (!n || n->kind != NODE_ATOM || !n->text) return 0;
    if (strcmp(n->text, "FS") == 0) *lane = OMI_FS;
    else if (strcmp(n->text, "GS") == 0) *lane = OMI_GS;
    else if (strcmp(n->text, "RS") == 0) *lane = OMI_RS;
    else if (strcmp(n->text, "US") == 0) *lane = OMI_US;
    else return 0;
    return 1;
}

static const char *lane_name(unsigned char lane)
{
    if (lane == OMI_FS) return "FS";
    if (lane == OMI_GS) return "GS";
    if (lane == OMI_RS) return "RS";
    if (lane == OMI_US) return "US";
    return "UNKNOWN";
}

static void event_push(EventList *events, unsigned char lane, const char *value)
{
    if (events->len == events->cap) {
        size_t cap = events->cap ? events->cap * 2 : 16;
        events->items = (Event *)xrealloc(events->items, cap * sizeof(Event));
        events->cap = cap;
    }
    events->items[events->len].lane = lane;
    events->items[events->len].value = xstrdup(value);
    events->len++;
}

static void events_free(EventList *events)
{
    size_t i;
    for (i = 0; i < events->len; i++) free(events->items[i].value);
    free(events->items);
    events->items = NULL;
    events->len = 0;
    events->cap = 0;
}

static int is_canonical_root(Node *root)
{
    return root && root->kind == NODE_LIST && root->count > 0 && atom_is(root->items[0], "omi");
}

static int contains_lane_pair(Node *n)
{
    unsigned char lane;
    size_t i;
    if (!n) return 0;
    if (n->kind == NODE_PAIR) {
        if (lane_from_atom(n->car, &lane)) return 1;
        return contains_lane_pair(n->car) || contains_lane_pair(n->cdr);
    }
    if (n->kind == NODE_LIST) {
        for (i = 0; i < n->count; i++) {
            if (contains_lane_pair(n->items[i])) return 1;
        }
    }
    return 0;
}

static void collect_canonical_node(Node *n, EventList *events, int depth)
{
    size_t i;
    if (!n) return;
    if (n->kind == NODE_LIST) {
        if (n->count > 0 && n->items[0]->kind == NODE_ATOM) {
            if (depth >= 2) event_push(events, OMI_RS, n->items[0]->text);
            for (i = 1; i < n->count; i++) collect_canonical_node(n->items[i], events, depth + 1);
            return;
        }
        for (i = 0; i < n->count; i++) collect_canonical_node(n->items[i], events, depth + 1);
    } else if (n->kind == NODE_PAIR) {
        collect_canonical_node(n->car, events, depth + 1);
        collect_canonical_node(n->cdr, events, depth + 1);
    } else if (depth >= 2) {
        char *label = node_to_label(n);
        event_push(events, OMI_US, label);
        free(label);
    }
}

static void collect_canonical(Node *root, EventList *events)
{
    size_t i;
    event_push(events, OMI_FS, "omi");
    for (i = 1; i < root->count; i++) {
        Node *section = root->items[i];
        if (section && section->kind == NODE_LIST && section->count > 0 && section->items[0]->kind == NODE_ATOM) {
            event_push(events, OMI_GS, section->items[0]->text);
            for (size_t j = 1; j < section->count; j++) {
                collect_canonical_node(section->items[j], events, 2);
            }
        } else {
            collect_canonical_node(section, events, 1);
        }
    }
}

static int try_collect_alist_pair(Node *n, EventList *events)
{
    unsigned char lane;
    if (!n || n->kind != NODE_PAIR) return 0;
    if (lane_from_atom(n->car, &lane)) {
        char *value = node_to_label(n->cdr);
        event_push(events, lane, value);
        free(value);
        return 1;
    }
    if (n->car && n->car->kind == NODE_PAIR && lane_from_atom(n->car->car, &lane)) {
        char *key = node_to_label(n->car->cdr);
        char *value = node_to_label(n->cdr);
        Buffer combined = {0};
        buffer_append(&combined, key);
        buffer_putc(&combined, '=');
        buffer_append(&combined, value);
        event_push(events, lane, combined.data ? combined.data : "");
        buffer_free(&combined);
        free(key);
        free(value);
        return 1;
    }
    return 0;
}

static void collect_alist(Node *n, EventList *events)
{
    size_t i;
    if (!n) return;
    if (n->kind == NODE_PAIR) {
        if (try_collect_alist_pair(n, events)) return;
        collect_alist(n->car, events);
        collect_alist(n->cdr, events);
    } else if (n->kind == NODE_LIST) {
        for (i = 0; i < n->count; i++) collect_alist(n->items[i], events);
    }
}

static uint64_t fnv1a64(const unsigned char *data, size_t len)
{
    uint64_t h = 1469598103934665603ull;
    size_t i;
    for (i = 0; i < len; i++) {
        h ^= (uint64_t)data[i];
        h *= 1099511628211ull;
    }
    return h;
}

static void build_tape(Compilation *c, const char *source)
{
    unsigned char header[8];
    size_t i;
    header[0] = 0x00;
    header[1] = 0x1b;
    header[2] = OMI_FS;
    header[3] = OMI_GS;
    header[4] = OMI_RS;
    header[5] = OMI_US;
    header[6] = source && source[0] ? (unsigned char)source[0] : 0x00;
    header[7] = c->state;
    buffer_append_bytes(&c->tape, header, sizeof(header));

    for (i = 0; i < c->events.len; i++) {
        const char *value = c->events.items[i].value;
        size_t n = strlen(value);
        unsigned char len_bytes[2];
        if (n > 65535u) die("metacompiler lane record too large");
        buffer_putc(&c->tape, c->events.items[i].lane);
        len_bytes[0] = (unsigned char)((n >> 8) & 0xffu);
        len_bytes[1] = (unsigned char)(n & 0xffu);
        buffer_append_bytes(&c->tape, len_bytes, sizeof(len_bytes));
        buffer_append_bytes(&c->tape, (const unsigned char *)value, n);
    }
}

static int compile_source(const char *source, Compilation *c, char *error, size_t error_len)
{
    Buffer normalized = {0};
    memset(c, 0, sizeof(*c));
    c->root = parse_source(source, error, error_len);
    if (!c->root) return 0;

    node_append_canonical(c->root, &normalized);
    c->normalized = normalized.data ? normalized.data : xstrdup("");

    if (is_canonical_root(c->root)) {
        snprintf(c->shape, sizeof(c->shape), "canonical");
        c->state = STATE_CANONICAL;
        collect_canonical(c->root, &c->events);
    } else if (contains_lane_pair(c->root)) {
        snprintf(c->shape, sizeof(c->shape), "alist");
        c->state = STATE_ALIST;
        collect_alist(c->root, &c->events);
    } else {
        snprintf(error, error_len, "unsupported declaration shape");
        return 0;
    }

    if (c->events.len == 0) {
        snprintf(error, error_len, "declaration produced no control lane records");
        return 0;
    }

    build_tape(c, source);
    c->source_hash = fnv1a64((const unsigned char *)source, strlen(source));
    c->normalized_hash = fnv1a64((const unsigned char *)c->normalized, strlen(c->normalized));
    c->tape_hash = fnv1a64((const unsigned char *)c->tape.data, c->tape.len);
    return 1;
}

static void compilation_free(Compilation *c)
{
    node_free(c->root);
    free(c->normalized);
    events_free(&c->events);
    buffer_free(&c->tape);
    memset(c, 0, sizeof(*c));
}

static char *read_file(const char *path, size_t *out_len)
{
    FILE *f = fopen(path, "rb");
    long n;
    char *data;
    if (!f) return NULL;
    if (fseek(f, 0, SEEK_END) != 0) {
        fclose(f);
        return NULL;
    }
    n = ftell(f);
    if (n < 0) {
        fclose(f);
        return NULL;
    }
    if (fseek(f, 0, SEEK_SET) != 0) {
        fclose(f);
        return NULL;
    }
    data = (char *)xmalloc((size_t)n + 1);
    if (fread(data, 1, (size_t)n, f) != (size_t)n) {
        free(data);
        fclose(f);
        return NULL;
    }
    fclose(f);
    data[n] = '\0';
    if (out_len) *out_len = (size_t)n;
    return data;
}

static int write_file(const char *path, const char *data, size_t len)
{
    FILE *f = fopen(path, "wb");
    if (!f) return 0;
    if (fwrite(data, 1, len, f) != len) {
        fclose(f);
        return 0;
    }
    return fclose(f) == 0;
}

static int ensure_dir(const char *path)
{
    if (mkdir(path, 0777) == 0) return 1;
    return errno == EEXIST;
}

static char *basename_no_ext(const char *path)
{
    const char *base = strrchr(path, '/');
    const char *dot;
    size_t n;
    if (base) base++;
    else base = path;
    dot = strrchr(base, '.');
    n = dot && dot > base ? (size_t)(dot - base) : strlen(base);
    return xstrndup(base, n);
}

static void append_hash(Buffer *b, uint64_t hash)
{
    char tmp[32];
    snprintf(tmp, sizeof(tmp), "0x%016llx", (unsigned long long)hash);
    buffer_append(b, tmp);
}

static void append_json_string_field(Buffer *b, const char *name, const char *value, int comma)
{
    buffer_append(b, "  \"");
    buffer_append(b, name);
    buffer_append(b, "\": \"");
    append_json_escaped(b, value ? value : "");
    buffer_append(b, comma ? "\",\n" : "\"\n");
}

static void append_receipt_json(Buffer *b, Compilation *c, const char *source_path, const char *artifact_path, const char *receipt_path)
{
    size_t i;
    size_t fs = 0, gs = 0, rs = 0, us = 0;
    for (i = 0; i < c->events.len; i++) {
        if (c->events.items[i].lane == OMI_FS) fs++;
        else if (c->events.items[i].lane == OMI_GS) gs++;
        else if (c->events.items[i].lane == OMI_RS) rs++;
        else if (c->events.items[i].lane == OMI_US) us++;
    }

    buffer_append(b, "{\n");
    append_json_string_field(b, "version", "OMI_DECLARATION_CONTROL_TAPE_V1", 1);
    append_json_string_field(b, "source", source_path, 1);
    append_json_string_field(b, "artifact", artifact_path, 1);
    append_json_string_field(b, "receipt", receipt_path, 1);
    append_json_string_field(b, "shape", c->shape, 1);
    buffer_append(b, "  \"header8\": [\"NUL\", \"ESC\", \"FS\", \"GS\", \"RS\", \"US\", \"0x");
    {
        char tmp[16];
        snprintf(tmp, sizeof(tmp), "%02x\", \"0x%02x\"],\n", c->tape.len >= 8 ? (unsigned char)c->tape.data[6] : 0, c->state);
        buffer_append(b, tmp);
    }
    buffer_append(b, "  \"sourceHash\": \"");
    append_hash(b, c->source_hash);
    buffer_append(b, "\",\n  \"normalizedHash\": \"");
    append_hash(b, c->normalized_hash);
    buffer_append(b, "\",\n  \"tapeHash\": \"");
    append_hash(b, c->tape_hash);
    buffer_append(b, "\",\n");
    buffer_append(b, "  \"tapeBytes\": ");
    {
        char tmp[64];
        snprintf(tmp, sizeof(tmp), "%zu,\n", c->tape.len);
        buffer_append(b, tmp);
    }
    buffer_append(b, "  \"lanes\": {");
    {
        char tmp[128];
        snprintf(tmp, sizeof(tmp), "\"FS\": %zu, \"GS\": %zu, \"RS\": %zu, \"US\": %zu},\n", fs, gs, rs, us);
        buffer_append(b, tmp);
    }
    buffer_append(b, "  \"normalized\": \"");
    append_json_escaped(b, c->normalized);
    buffer_append(b, "\",\n  \"records\": [\n");
    for (i = 0; i < c->events.len; i++) {
        buffer_append(b, "    {\"lane\": \"");
        buffer_append(b, lane_name(c->events.items[i].lane));
        buffer_append(b, "\", \"code\": \"0x");
        {
            char tmp[8];
            snprintf(tmp, sizeof(tmp), "%02x", c->events.items[i].lane);
            buffer_append(b, tmp);
        }
        buffer_append(b, "\", \"value\": \"");
        append_json_escaped(b, c->events.items[i].value);
        buffer_append(b, i + 1 == c->events.len ? "\"}\n" : "\"},\n");
    }
    buffer_append(b, "  ]\n}\n");
}

static int command_compile(const char *path)
{
    char *source;
    char *base;
    char artifact[512];
    char receipt[512];
    char error[256];
    Buffer json = {0};
    Compilation c;

    source = read_file(path, NULL);
    if (!source) {
        fprintf(stderr, "cannot read %s\n", path);
        return 1;
    }
    if (!compile_source(source, &c, error, sizeof(error))) {
        fprintf(stderr, "compile error: %s\n", error);
        free(source);
        return 1;
    }
    if (!ensure_dir("dist") || !ensure_dir("dist/omi-docs")) {
        fprintf(stderr, "cannot create dist/omi-docs\n");
        compilation_free(&c);
        free(source);
        return 1;
    }
    base = basename_no_ext(path);
    snprintf(artifact, sizeof(artifact), "dist/omi-docs/%s.odct", base);
    snprintf(receipt, sizeof(receipt), "dist/omi-docs/%s.receipt.json", base);
    free(base);

    if (!write_file(artifact, c.tape.data, c.tape.len)) {
        fprintf(stderr, "cannot write %s\n", artifact);
        compilation_free(&c);
        free(source);
        return 1;
    }
    append_receipt_json(&json, &c, path, artifact, receipt);
    if (!write_file(receipt, json.data, json.len)) {
        fprintf(stderr, "cannot write %s\n", receipt);
        buffer_free(&json);
        compilation_free(&c);
        free(source);
        return 1;
    }
    fwrite(json.data, 1, json.len, stdout);
    buffer_free(&json);
    compilation_free(&c);
    free(source);
    return 0;
}

static int command_inspect(const char *path)
{
    char *source;
    char error[256];
    Buffer json = {0};
    Compilation c;
    source = read_file(path, NULL);
    if (!source) {
        fprintf(stderr, "cannot read %s\n", path);
        return 1;
    }
    if (!compile_source(source, &c, error, sizeof(error))) {
        fprintf(stderr, "inspect error: %s\n", error);
        free(source);
        return 1;
    }
    append_receipt_json(&json, &c, path, "", "");
    fwrite(json.data, 1, json.len, stdout);
    buffer_free(&json);
    compilation_free(&c);
    free(source);
    return 0;
}

static void print_escaped_value(const unsigned char *bytes, size_t len)
{
    size_t i;
    for (i = 0; i < len; i++) {
        unsigned char c = bytes[i];
        if (c == '\n') printf("\\n");
        else if (c == '\r') printf("\\r");
        else if (c == '\t') printf("\\t");
        else if (c < 0x20 || c == 0x7f) printf("\\x%02x", c);
        else putchar((int)c);
    }
}

static int command_decompile(const char *path)
{
    size_t len;
    size_t pos = 8;
    unsigned char *bytes = (unsigned char *)read_file(path, &len);
    if (!bytes) {
        fprintf(stderr, "cannot read %s\n", path);
        return 1;
    }
    if (len < 8) {
        fprintf(stderr, "invalid control tape: missing HEADER8\n");
        free(bytes);
        return 1;
    }
    printf("OMI_DECLARATION_CONTROL_TAPE v1\n");
    printf("HEADER8: NUL ESC FS GS RS US input=0x%02x state=0x%02x\n", bytes[6], bytes[7]);
    while (pos < len) {
        unsigned char lane;
        size_t n;
        if (pos + 3 > len) {
            fprintf(stderr, "invalid control tape: truncated lane record\n");
            free(bytes);
            return 1;
        }
        lane = bytes[pos++];
        n = ((size_t)bytes[pos] << 8) | (size_t)bytes[pos + 1];
        pos += 2;
        if (pos + n > len) {
            fprintf(stderr, "invalid control tape: lane record length exceeds tape\n");
            free(bytes);
            return 1;
        }
        printf("%s ", lane_name(lane));
        print_escaped_value(bytes + pos, n);
        printf("\n");
        pos += n;
    }
    free(bytes);
    return 0;
}

static int command_repl(void)
{
    char line[4096];
    printf("omi-metacompiler declaration inspector; type :quit to exit\n");
    while (fgets(line, sizeof(line), stdin)) {
        char error[256];
        Compilation c;
        if (strncmp(line, ":quit", 5) == 0) break;
        if (!compile_source(line, &c, error, sizeof(error))) {
            printf("reject %s\n", error);
            continue;
        }
        printf("accept shape=%s records=%zu tapeHash=0x%016llx\n",
            c.shape,
            c.events.len,
            (unsigned long long)c.tape_hash);
        compilation_free(&c);
    }
    return 0;
}

static void usage(FILE *out)
{
    fprintf(out,
        "usage: omi-metacompiler <compile|decompile|inspect|repl> [file]\n"
        "  compile <file>    write dist/omi-docs/<name>.odct and receipt JSON\n"
        "  decompile <file>  render control bytes as escaped lane records\n"
        "  inspect <file>    print normalized declaration and receipts\n"
        "  repl              inspect declarations from stdin, no eval/apply\n");
}

int main(int argc, char **argv)
{
    if (argc < 2) {
        usage(stderr);
        return 1;
    }
    if (strcmp(argv[1], "compile") == 0) {
        if (argc != 3) {
            usage(stderr);
            return 1;
        }
        return command_compile(argv[2]);
    }
    if (strcmp(argv[1], "decompile") == 0) {
        if (argc != 3) {
            usage(stderr);
            return 1;
        }
        return command_decompile(argv[2]);
    }
    if (strcmp(argv[1], "inspect") == 0) {
        if (argc != 3) {
            usage(stderr);
            return 1;
        }
        return command_inspect(argv[2]);
    }
    if (strcmp(argv[1], "repl") == 0) {
        return command_repl();
    }
    usage(stderr);
    return 1;
}
