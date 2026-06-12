#define _POSIX_C_SOURCE 200809L
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <ctype.h>

#define MAX_LINE 4096
#define MAX_HEX  64
#define OMICRON_ENTRY   0x03BF
#define OMICRON_CLOSURE 0x039F
#define BRIDGE_MARKER   0x0020
#define PIPE_BYTE       0x007C
#define PIPE_SCOPE      0x7C00
#define ACCEPT_SEAL     0xAA55
#define ACCEPT_BYTE     0x0055
#define ESCAPE_BYTE     0x002D
#define MCRSGSP_SCALE   0x3F
#define MAX_RECONSTRUCTION_SLOTS 8
#define MAX_N 64
#define MAX_PEERS 16
#define MAX_DEPS 16
#define MAX_PEER_ID 32
#define MAX_REQUIRES 512
#define MAX_PROOF 256
#define MAX_FRAG_ROOTS 64
#define MAX_FRAGS_FIELD 512
#define MAX_BASIS_FIELD 256
#define RS_MODE_XOR "xor"
#define RS_MODE_GF256 "gf256"
#define GF256_POLY_DEFAULT "0x11d"
#define RS_LAYOUT_ROOT16 "root16"

/* Canon note:
 *   0x007C = readable pipe byte / stream delimiter (relation field)
 *   0x7C00 = scoped pipe word / runtime handoff (pipe scope constant)
 *   0x0055 = low acceptance byte (unit field seal nibble)
 *   0xAA55 = full acceptance seal (pre-0xAA55/post-0xAA55 boundary)
 *
 *   Scale 0x3F = lfsr-period / MCRSGSP carrier scale.
 *   MCRSGSP fragment, frontier, request, and candidate messages ride inside
 *   OmiPipe frames at scale 0x3F.  CAR/CDR/CID remain the universal witness
 *   triple; the type-specific query fields (t=, id=, idx=, k=, n=, vv=,
 *   peer=, missing=) are validated by the MCRSGSP carrier layer.
 *
 *   Reconstruction layer: k-of-n fragment tracking, frontier aggregation,
 *   and RS-sufficient candidate detection.  When k distinct fragments of
 *   the same codeword have been collected, omi-receipt:candidate is emitted.
 *
 *   The parser canonizes 0x007C as the readable pipe marker and resolves
 *   it into 0x7C00 as the scoped pipe word during receipt emission.
 */

static const char *RECEIPT_OK  = "omi-receipt:accepted";
static const char *RECEIPT_REJ = "omi-reject:";
static const char *RECEIPT_RPR = "omi-repair:";
static const char *RECEIPT_CAND = "omi-receipt:candidate";

/* hex nibble to int */
static int hexval(char c) {
    if (c >= '0' && c <= '9') return c - '0';
    if (c >= 'a' && c <= 'f') return c - 'a' + 10;
    if (c >= 'A' && c <= 'F') return c - 'A' + 10;
    return -1;
}

/* parse hex string to uint32_t, return bytes consumed */
static int parse_hex(const char *s, uint32_t *out) {
    uint32_t v = 0;
    int i = 0;
    while (s[i] && i < 8) {
        int h = hexval(s[i]);
        if (h < 0) break;
        v = (v << 4) | h;
        i++;
    }
    *out = v;
    return i;
}

/* parse hex string of exact nibble count to uint32_t */
static int parse_hex_n(const char *s, int nibbles, uint32_t *out) {
    uint32_t v = 0;
    for (int i = 0; i < nibbles; i++) {
        int h = hexval(s[i]);
        if (h < 0) return -1;
        v = (v << 4) | h;
    }
    *out = v;
    return 0;
}

/* parse decimal integer */
static int parse_int(const char *s, int *out) {
    if (!s || !*s) return -1;
    char *end = NULL;
    long v = strtol(s, &end, 10);
    if (end == s || v < 0) return -1;
    *out = (int)v;
    return 0;
}

/* Omi-Gauge cell: row<<12 | x<<6 | y */
static uint32_t omi_gauge_cell(uint8_t row, uint8_t x, uint8_t y) {
    return ((uint32_t)row << 12) | ((uint32_t)x << 6) | y;
}

/* Omi-Nomogram scale function: maps scale selector to operation id */
static const char *omi_nomogram_name(uint8_t scale) {
    switch (scale) {
        case 0x30: return "identity";
        case 0x31: return "log-mul-div";
        case 0x32: return "sq-sqrt";
        case 0x33: return "cube-cuberoot";
        case 0x34: return "pi-fold";
        case 0x35: return "reciprocal";
        case 0x36: return "sin-cos";
        case 0x37: return "tan-cot";
        case 0x38: return "small-angle";
        case 0x39: return "pythagorean";
        case 0x3A: return "log10-pow10";
        case 0x3B: return "ln-exp-query";
        case 0x3C: return "sexagesimal-60";
        case 0x3D: return "roots-powers";
        case 0x3E: return "quadratic-gnomon";
        case 0x3F: return "lfsr-period";
        default:   return "unknown";
    }
}

/* CAR/CDR/CID verification: car XOR cdr == cid */
static int verify_car_cdr_cid(uint32_t car, uint32_t cdr, uint32_t cid) {
    return (car ^ cdr) == cid;
}

/* Two-cube mirror: 0xNM ↔ 0xMN */
static uint8_t two_cube_mirror(uint8_t b) {
    return ((b & 0xF0) >> 4) | ((b & 0x0F) << 4);
}

/* Two-cube delta */
static uint8_t two_cube_delta(uint8_t a, uint8_t b) {
    return a ^ b;
}

/* MCRSGSP carrier message types */
#define MAX_TYPE 32
#define MAX_ID 64
#define MAX_VV 256
#define MAX_PEER 64
#define MAX_MISSING 256

static const char *MCRSGSP_TYPE_FRAG       = "mcrsgsp-frag";
static const char *MCRSGSP_TYPE_FRONTIER   = "mcrsgsp-frontier";
static const char *MCRSGSP_TYPE_REQUEST    = "mcrsgsp-request";
static const char *MCRSGSP_TYPE_CANDIDATE  = "mcrsgsp-candidate";
static const char *MCRSGSP_TYPE_RECONSTRUCT = "mcrsgsp-reconstruction";
static const char *OMI_TYPE_ACCEPT_CANDIDATE = "omi-accept-candidate";
static const char *OMI_TYPE_ACCEPTED_CANDIDATE = "omi-accepted-candidate";

struct mcrsgsp_fields {
    char type[MAX_TYPE];
    char id[MAX_ID];
    int  idx;
    int  k;
    int  n;
    int  has_idx;
    int  has_k;
    int  has_n;
    char vv[MAX_VV];
    int has_vv;
    char requires[MAX_REQUIRES];
    int has_requires;
    char proof[MAX_PROOF];
    int has_proof;
    char frags[MAX_FRAGS_FIELD];
    char rs_mode[16];
    char gf_poly[16];
    char layout[16];
    int has_frags;
    int has_rs_mode;
    int has_gf_poly;
    int has_layout;
    char basis[MAX_BASIS_FIELD];
    int has_basis;
    char peer[MAX_PEER];
    char missing[MAX_MISSING];
    char subset[256];
    uint32_t candidate_root;
    int has_candidate_root;
    int candidate_root_malformed;
};

struct vv_entry {
    char peer[MAX_PEER_ID];
    uint32_t counter;
};

struct version_vector {
    struct vv_entry entries[MAX_PEERS];
    int count;
};

struct fragment_roots {
    uint32_t roots[MAX_FRAG_ROOTS];
    uint8_t present[MAX_FRAG_ROOTS];
};

/* Parse the query portion: ?key=val;key=val;... */
/* Extracts car, cdr, cid (hex) plus MCRSGSP carrier fields */
static int parse_query(const char *q,
                       uint32_t *car, uint32_t *cdr, uint32_t *cid,
                       struct mcrsgsp_fields *mcrsgsp) {
    if (!q || *q != '?') return -1;
    memset(mcrsgsp, 0, sizeof(*mcrsgsp));
    mcrsgsp->idx = -1;
    mcrsgsp->k = -1;
    mcrsgsp->n = -1;
    q++;
    while (*q) {
        while (*q == ';' || *q == '&') q++;
        if (!*q) break;
        const char *key = q;
        while (*q && *q != '=' && *q != ';' && *q != '&') q++;
        int klen = q - key;
        if (*q == '=') q++;
        const char *val = q;
        while (*q && *q != ';' && *q != '&') q++;
        int vlen = q - val;
        if (vlen > 0) {
            uint32_t tmp = 0;
            int nibbles = vlen > 8 ? 8 : vlen;
            parse_hex_n(val, nibbles, &tmp);
            if (klen == 3 && strncmp(key, "car", 3) == 0) *car = tmp;
            if (klen == 3 && strncmp(key, "cdr", 3) == 0) *cdr = tmp;
            if (klen == 3 && strncmp(key, "cid", 3) == 0) *cid = tmp;
            if (klen == 1 && *key == 't') {
                int clen = vlen < MAX_TYPE - 1 ? vlen : MAX_TYPE - 1;
                memcpy(mcrsgsp->type, val, clen);
                mcrsgsp->type[clen] = 0;
            }
            if (klen == 2 && strncmp(key, "id", 2) == 0) {
                int clen = vlen < MAX_ID - 1 ? vlen : MAX_ID - 1;
                memcpy(mcrsgsp->id, val, clen);
                mcrsgsp->id[clen] = 0;
            }
            if (klen == 3 && strncmp(key, "idx", 3) == 0) {
                char buf[32];
                int clen = vlen < 31 ? vlen : 31;
                memcpy(buf, val, clen); buf[clen] = 0;
                parse_int(buf, &mcrsgsp->idx);
                mcrsgsp->has_idx = 1;
            }
            if (klen == 1 && *key == 'k') {
                char buf[32];
                int clen = vlen < 31 ? vlen : 31;
                memcpy(buf, val, clen); buf[clen] = 0;
                parse_int(buf, &mcrsgsp->k);
                mcrsgsp->has_k = 1;
            }
            if (klen == 1 && *key == 'n') {
                char buf[32];
                int clen = vlen < 31 ? vlen : 31;
                memcpy(buf, val, clen); buf[clen] = 0;
                parse_int(buf, &mcrsgsp->n);
                mcrsgsp->has_n = 1;
            }
            if (klen == 2 && strncmp(key, "vv", 2) == 0) {
                int clen = vlen < MAX_VV - 1 ? vlen : MAX_VV - 1;
                memcpy(mcrsgsp->vv, val, clen);
                mcrsgsp->vv[clen] = 0;
                mcrsgsp->has_vv = 1;
            }
            if (klen == 8 && strncmp(key, "requires", 8) == 0) {
                int clen = vlen < MAX_REQUIRES - 1 ? vlen : MAX_REQUIRES - 1;
                memcpy(mcrsgsp->requires, val, clen);
                mcrsgsp->requires[clen] = 0;
                mcrsgsp->has_requires = 1;
            }
            if (klen == 5 && strncmp(key, "proof", 5) == 0) {
                int clen = vlen < MAX_PROOF - 1 ? vlen : MAX_PROOF - 1;
                memcpy(mcrsgsp->proof, val, clen);
                mcrsgsp->proof[clen] = 0;
                mcrsgsp->has_proof = 1;
            }
            if (klen == 5 && strncmp(key, "frags", 5) == 0) {
                int clen = vlen < MAX_FRAGS_FIELD - 1 ? vlen : MAX_FRAGS_FIELD - 1;
                memcpy(mcrsgsp->frags, val, clen);
                mcrsgsp->frags[clen] = 0;
                mcrsgsp->has_frags = 1;
            }
            if (klen == 2 && strncmp(key, "rs", 2) == 0) {
                int clen = vlen < (int)sizeof(mcrsgsp->rs_mode) - 1 ? vlen : (int)sizeof(mcrsgsp->rs_mode) - 1;
                memcpy(mcrsgsp->rs_mode, val, clen);
                mcrsgsp->rs_mode[clen] = 0;
                mcrsgsp->has_rs_mode = 1;
            }
            if (klen == 2 && strncmp(key, "gf", 2) == 0) {
                int clen = vlen < (int)sizeof(mcrsgsp->gf_poly) - 1 ? vlen : (int)sizeof(mcrsgsp->gf_poly) - 1;
                memcpy(mcrsgsp->gf_poly, val, clen);
                mcrsgsp->gf_poly[clen] = 0;
                mcrsgsp->has_gf_poly = 1;
            }
            if (klen == 6 && strncmp(key, "layout", 6) == 0) {
                int clen = vlen < (int)sizeof(mcrsgsp->layout) - 1 ? vlen : (int)sizeof(mcrsgsp->layout) - 1;
                memcpy(mcrsgsp->layout, val, clen);
                mcrsgsp->layout[clen] = 0;
                mcrsgsp->has_layout = 1;
            }
            if (klen == 5 && strncmp(key, "basis", 5) == 0) {
                int clen = vlen < MAX_BASIS_FIELD - 1 ? vlen : MAX_BASIS_FIELD - 1;
                memcpy(mcrsgsp->basis, val, clen);
                mcrsgsp->basis[clen] = 0;
                mcrsgsp->has_basis = 1;
            }
            if (klen == 4 && strncmp(key, "peer", 4) == 0) {
                int clen = vlen < MAX_PEER - 1 ? vlen : MAX_PEER - 1;
                memcpy(mcrsgsp->peer, val, clen);
                mcrsgsp->peer[clen] = 0;
            }
            if (klen == 7 && strncmp(key, "missing", 7) == 0) {
                int clen = vlen < MAX_MISSING - 1 ? vlen : MAX_MISSING - 1;
                memcpy(mcrsgsp->missing, val, clen);
                mcrsgsp->missing[clen] = 0;
            }
            if (klen == 6 && strncmp(key, "subset", 6) == 0) {
                int clen = vlen < 255 ? vlen : 255;
                memcpy(mcrsgsp->subset, val, clen);
                mcrsgsp->subset[clen] = 0;
            }
            if (klen == 14 && strncmp(key, "candidate-root", 14) == 0) {
                mcrsgsp->has_candidate_root = 1;
                if (vlen <= 0 || vlen > 8 ||
                    parse_hex_n(val, vlen, &mcrsgsp->candidate_root) < 0) {
                    mcrsgsp->candidate_root_malformed = 1;
                }
            }
        }
    }
    return 0;
}

/* Tokenize a hyphen-delimited frame segment (max 8 tokens) */
static int tokenize_frame(const char *s, uint8_t *tokens, int max) {
    int n = 0;
    while (*s && n < max) {
        uint32_t v = 0;
        int consumed = parse_hex(s, &v);
        if (consumed == 0) break;
        tokens[n++] = (uint8_t)(v & 0xFF);
        s += consumed;
        if (*s == '-') s++;
        else break;
    }
    return n;
}

enum pipe_state {
    PIPE_OK,
    PIPE_REJECT,
    PIPE_REPAIR,
    PIPE_CANDIDATE
};

struct omi_frame {
    uint8_t  frame_bytes[8];
    int      frame_count;
    uint8_t  control;
    uint8_t  scale;
    uint8_t  relation;
    uint8_t  unit;
    uint32_t car, cdr, cid;
    int      has_query;
    struct   mcrsgsp_fields mcrsgsp;
    char     raw[MAX_LINE];
};

/* Forward declarations for MCRSGSP/OMI acceptance validators */
static enum pipe_state validate_omi_accept_candidate(struct omi_frame *f,
                                                       char *diag, size_t diag_sz,
                                                       uint32_t *repair_cid);

static int parse_omi_line(const char *line, struct omi_frame *f) {
    memset(f, 0, sizeof(*f));
    f->mcrsgsp.idx = -1;
    f->mcrsgsp.k = -1;
    f->mcrsgsp.n = -1;
    snprintf(f->raw, sizeof(f->raw), "%s", line);

    const char *p = line;
    if (strncmp(p, "omi-", 4) != 0) return -1;
    p += 4;

    char frame_buf[128];
    int fi = 0;
    while (*p && *p != '/' && fi < 127) {
        frame_buf[fi++] = *p++;
    }
    frame_buf[fi] = 0;
    f->frame_count = tokenize_frame(frame_buf, f->frame_bytes, 8);

    if (*p != '/') return -1;
    p++;

    uint32_t ctrl = 0;
    int c = parse_hex(p, &ctrl);
    if (c == 0) return -1;
    f->control = (uint8_t)(ctrl & 0xFF);
    p += c;
    if (*p != '/') return -1;
    p++;

    uint32_t scl = 0;
    c = parse_hex(p, &scl);
    if (c == 0) return -1;
    f->scale = (uint8_t)(scl & 0xFF);
    p += c;
    if (*p != '/') return -1;
    p++;

    uint32_t rel = 0;
    c = parse_hex(p, &rel);
    if (c == 0) return -1;
    f->relation = (uint8_t)(rel & 0xFF);
    p += c;
    if (*p != '/') return -1;
    p++;

    uint32_t unt = 0;
    c = parse_hex(p, &unt);
    if (c == 0) return -1;
    f->unit = (uint8_t)(unt & 0xFF);
    p += c;

    if (*p == '-') { p++; }
    if (strncmp(p, "imo", 3) == 0) p += 3;

    if (*p == '?') {
        f->has_query = 1;
        parse_query(p, &f->car, &f->cdr, &f->cid, &f->mcrsgsp);
    }

    return 0;
}

/* Validate MCRSGSP carrier fields. Returns PIPE_OK, PIPE_REJECT, or PIPE_REPAIR. */
static enum pipe_state validate_mcrsgsp(struct omi_frame *f,
                                         char *diag, size_t diag_sz,
                                         uint32_t *repair_cid) {
    struct mcrsgsp_fields *m = &f->mcrsgsp;

    if (m->type[0] == 0) {
        snprintf(diag, diag_sz, "missing-mcrsgsp-type;scale=0x%02x", f->scale);
        return PIPE_REJECT;
    }

    int valid_type = 0;
    if (strcmp(m->type, MCRSGSP_TYPE_FRAG) == 0) valid_type = 1;
    if (strcmp(m->type, MCRSGSP_TYPE_FRONTIER) == 0) valid_type = 1;
    if (strcmp(m->type, MCRSGSP_TYPE_REQUEST) == 0) valid_type = 1;
    if (strcmp(m->type, MCRSGSP_TYPE_CANDIDATE) == 0) valid_type = 1;
    if (strcmp(m->type, MCRSGSP_TYPE_RECONSTRUCT) == 0) valid_type = 1;
    if (strcmp(m->type, OMI_TYPE_ACCEPT_CANDIDATE) == 0) valid_type = 1;

    if (!valid_type) {
        snprintf(diag, diag_sz, "unknown-mcrsgsp-type:%s", m->type);
        return PIPE_REJECT;
    }

    if (strcmp(m->type, MCRSGSP_TYPE_FRAG) == 0) {
        if (m->id[0] == 0) {
            snprintf(diag, diag_sz, "missing-codeword-id;type=%s", m->type);
            return PIPE_REJECT;
        }
        if (!m->has_idx || m->idx < 0) {
            snprintf(diag, diag_sz, "missing-or-invalid-idx;type=%s;id=%s", m->type, m->id);
            return PIPE_REJECT;
        }
        if (m->has_k && m->has_n) {
            if (m->k > m->n) {
                snprintf(diag, diag_sz, "k-greater-than-n;type=%s;id=%s;k=%d;n=%d", m->type, m->id, m->k, m->n);
                return PIPE_REJECT;
            }
            if (m->idx >= m->n) {
                snprintf(diag, diag_sz, "idx-out-of-range;type=%s;id=%s;idx=%d;n=%d", m->type, m->id, m->idx, m->n);
                return PIPE_REJECT;
            }
        }
    }

    if (strcmp(m->type, MCRSGSP_TYPE_FRONTIER) == 0) {
        if (m->peer[0] == 0) {
            snprintf(diag, diag_sz, "missing-peer-id;type=%s", m->type);
            return PIPE_REJECT;
        }
        if (f->cdr == 0 && m->vv[0] == 0) {
            snprintf(diag, diag_sz, "missing-version-vector;type=%s;peer=%s", m->type, m->peer);
            return PIPE_REJECT;
        }
    }

    if (strcmp(m->type, MCRSGSP_TYPE_REQUEST) == 0) {
        if (m->id[0] == 0) {
            snprintf(diag, diag_sz, "missing-codeword-id;type=%s", m->type);
            return PIPE_REJECT;
        }
        if (m->missing[0] == 0) {
            snprintf(diag, diag_sz, "missing-missing-indices;type=%s;id=%s", m->type, m->id);
            return PIPE_REJECT;
        }
    }

    if (strcmp(m->type, MCRSGSP_TYPE_CANDIDATE) == 0) {
        if (m->id[0] == 0) {
            snprintf(diag, diag_sz, "missing-codeword-id;type=%s", m->type);
            return PIPE_REJECT;
        }
        if (m->has_k && m->has_n) {
            if (m->k > m->n) {
                snprintf(diag, diag_sz, "k-greater-than-n;type=%s;id=%s;k=%d;n=%d", m->type, m->id, m->k, m->n);
                return PIPE_REJECT;
            }
        }
        if (f->car == 0 && m->id[0] != 0) {
            snprintf(diag, diag_sz, "missing-car-for-candidate;type=%s;id=%s", m->type, m->id);
            return PIPE_REJECT;
        }
    }

    if (strcmp(m->type, MCRSGSP_TYPE_RECONSTRUCT) == 0) {
        snprintf(diag, diag_sz, "reconstruction-type-in-query;type=%s", m->type);
        return PIPE_REJECT;
    }

    if (strcmp(m->type, OMI_TYPE_ACCEPT_CANDIDATE) == 0) {
        return validate_omi_accept_candidate(f, diag, diag_sz, repair_cid);
    }

    if (f->has_query && !verify_car_cdr_cid(f->car, f->cdr, f->cid)) {
        *repair_cid = f->car ^ f->cdr;
        snprintf(diag, diag_sz,
                 "car-cdr-cid-mismatch;type=%s;car=0x%04x;cdr=0x%04x;cid=0x%04x;repair-cid=0x%04x",
                 m->type, f->car, f->cdr, f->cid, *repair_cid);
        return PIPE_REPAIR;
    }

    return PIPE_OK;
}

/* Reconstruction state: per-codeword tracking of k-of-n fragment collection */
struct reconstruction_slot {
    char id[MAX_ID];
    int  k;
    int  n;
    struct fragment_roots roots;
    uint64_t seen_bitmask;
    int  count;
    uint32_t car_xor;
    int  emitted;
};

static struct reconstruction_slot g_slots[MAX_RECONSTRUCTION_SLOTS];
static int g_slot_count = 0;

/* Find slot by (id, k, n), or create if not full */
static struct reconstruction_slot *find_or_create_slot(const char *id, int k, int n) {
    for (int i = 0; i < g_slot_count; i++) {
        if (strcmp(g_slots[i].id, id) == 0 && g_slots[i].k == k && g_slots[i].n == n)
            return &g_slots[i];
    }
    if (g_slot_count >= MAX_RECONSTRUCTION_SLOTS) return NULL;
    struct reconstruction_slot *s = &g_slots[g_slot_count++];
    memset(s, 0, sizeof(*s));
    snprintf(s->id, sizeof(s->id), "%s", id);
    s->k = k;
    s->n = n;
    return s;
}

static struct reconstruction_slot *find_slot(const char *id, int k, int n) {
    for (int i = 0; i < g_slot_count; i++) {
        if (strcmp(g_slots[i].id, id) == 0 && g_slots[i].k == k && g_slots[i].n == n)
            return &g_slots[i];
    }
    return NULL;
}

/* Update slot with a received fragment index and car value. Returns 1 if candidate threshold reached. */
static int update_reconstruction(struct reconstruction_slot *s, int idx, uint32_t car) {
    if (idx < 0 || idx >= MAX_N) return 0;
    if (idx >= s->n) return 0;
    uint64_t bit = (uint64_t)1 << idx;
    if (s->seen_bitmask & bit) return 0;
    if (idx < MAX_FRAG_ROOTS) {
        s->roots.roots[idx] = car;
        s->roots.present[idx] = 1;
    }
    s->seen_bitmask |= bit;
    s->count++;
    s->car_xor ^= car;
    if (s->count >= s->k && !s->emitted) return 1;
    return 0;
}

/* Build subset string from seen_bitmask (e.g., "0,2,4") */
static void format_subset(uint64_t bitmask, int n, char *buf, size_t bufsz) {
    buf[0] = 0;
    size_t pos = 0;
    for (int i = 0; i < n && pos < bufsz - 1; i++) {
        if (bitmask & ((uint64_t)1 << i)) {
            if (pos > 0) {
                buf[pos++] = ',';
                if (pos >= bufsz - 1) break;
            }
            int r = snprintf(buf + pos, bufsz - pos, "%d", i);
            if (r > 0) pos += r;
            if (pos >= bufsz) break;
        }
    }
    buf[pos] = 0;
}

/* Emit candidate receipt on stdout */
static void emit_candidate_receipt(struct reconstruction_slot *s) {
    char subset[256];
    format_subset(s->seen_bitmask, s->n < MAX_N ? s->n : MAX_N, subset, sizeof(subset));

    printf("%s;type=mcrsgsp-reconstruction;id=%s;k=%d;n=%d;subset=%s;candidate-root=0x%04x;scope=0x%04x\n",
           RECEIPT_CAND, s->id, s->k, s->n, subset, s->car_xor, PIPE_SCOPE);
    fflush(stdout);
    s->emitted = 1;
}

static int peer_id_valid(const char *peer) {
    if (!peer || !*peer) return 0;
    for (const char *p = peer; *p; p++) {
        if (!(isalnum((unsigned char)*p) || *p == '_' || *p == '-' || *p == '.')) return 0;
    }
    return 1;
}

static int parse_version_vector(const char *s,
                                struct version_vector *out,
                                char *diag, size_t diag_sz) {
    memset(out, 0, sizeof(*out));
    if (!s || !*s) {
        snprintf(diag, diag_sz, "malformed-version-vector");
        return -1;
    }
    for (const char *p = s; *p; p++) {
        if (isspace((unsigned char)*p)) {
            snprintf(diag, diag_sz, "malformed-version-vector");
            return -1;
        }
    }

    const char *p = s;
    char prev_peer[MAX_PEER_ID];
    prev_peer[0] = 0;
    while (*p) {
        if (out->count >= MAX_PEERS) {
            snprintf(diag, diag_sz, "malformed-version-vector");
            return -1;
        }

        const char *peer_start = p;
        while (*p && *p != ':' && *p != ',') p++;
        if (*p != ':') {
            snprintf(diag, diag_sz, "malformed-version-vector");
            return -1;
        }
        size_t peer_len = (size_t)(p - peer_start);
        if (peer_len == 0 || peer_len >= MAX_PEER_ID) {
            snprintf(diag, diag_sz, "malformed-version-vector");
            return -1;
        }

        char peer[MAX_PEER_ID];
        memcpy(peer, peer_start, peer_len);
        peer[peer_len] = 0;
        if (!peer_id_valid(peer)) {
            snprintf(diag, diag_sz, "malformed-version-vector");
            return -1;
        }

        if (prev_peer[0]) {
            int cmp = strcmp(prev_peer, peer);
            if (cmp == 0) {
                snprintf(diag, diag_sz, "duplicate-version-vector-peer");
                return -1;
            }
            if (cmp > 0) {
                snprintf(diag, diag_sz, "version-vector-not-sorted");
                return -1;
            }
        }

        p++;
        if (*p == '-') {
            snprintf(diag, diag_sz, "negative-version-counter");
            return -1;
        }
        if (!isdigit((unsigned char)*p)) {
            snprintf(diag, diag_sz, "malformed-version-vector");
            return -1;
        }

        uint64_t counter = 0;
        while (*p && *p != ',') {
            if (!isdigit((unsigned char)*p)) {
                snprintf(diag, diag_sz, "malformed-version-vector");
                return -1;
            }
            counter = counter * 10u + (uint64_t)(*p - '0');
            if (counter > UINT32_MAX) {
                snprintf(diag, diag_sz, "malformed-version-vector");
                return -1;
            }
            p++;
        }

        snprintf(out->entries[out->count].peer, sizeof(out->entries[out->count].peer), "%s", peer);
        out->entries[out->count].counter = (uint32_t)counter;
        out->count++;
        snprintf(prev_peer, sizeof(prev_peer), "%s", peer);

        if (*p == ',') {
            p++;
            if (!*p) {
                snprintf(diag, diag_sz, "malformed-version-vector");
                return -1;
            }
        }
    }

    return out->count > 0 ? 0 : -1;
}

static int vv_get(const struct version_vector *v, const char *peer, uint32_t *counter) {
    for (int i = 0; i < v->count; i++) {
        int cmp = strcmp(v->entries[i].peer, peer);
        if (cmp == 0) {
            *counter = v->entries[i].counter;
            return 1;
        }
        if (cmp > 0) break;
    }
    *counter = 0;
    return 0;
}

static int vv_leq(const struct version_vector *a, const struct version_vector *b) {
    for (int i = 0; i < a->count; i++) {
        uint32_t bc = 0;
        vv_get(b, a->entries[i].peer, &bc);
        if (a->entries[i].counter > bc) return 0;
    }
    return 1;
}

static int parse_dependency_vector(const char *s,
                                   struct version_vector *out,
                                   char *diag, size_t diag_sz) {
    char vv_diag[128];
    if (parse_version_vector(s, out, vv_diag, sizeof(vv_diag)) == 0) return 0;

    if (strcmp(vv_diag, "version-vector-not-sorted") == 0) {
        snprintf(diag, diag_sz, "dependency-vector-not-sorted");
    } else if (strcmp(vv_diag, "duplicate-version-vector-peer") == 0) {
        snprintf(diag, diag_sz, "duplicate-dependency-peer");
    } else if (strcmp(vv_diag, "negative-version-counter") == 0) {
        snprintf(diag, diag_sz, "%s", vv_diag);
    } else {
        snprintf(diag, diag_sz, "malformed-dependency-vector");
    }
    return -1;
}

static int parse_requires_and_check(const char *requires,
                                    const struct version_vector *candidate,
                                    char *bad_dep, size_t bad_dep_sz,
                                    char *diag, size_t diag_sz) {
    if (!requires || !*requires) {
        snprintf(diag, diag_sz, "missing-causal-proof");
        return -1;
    }

    const char *p = requires;
    int dep_count = 0;
    while (*p) {
        if (dep_count >= MAX_DEPS) {
            snprintf(diag, diag_sz, "malformed-dependency-vector");
            return -1;
        }
        const char *start = p;
        while (*p && *p != '|') p++;
        size_t len = (size_t)(p - start);
        if (len == 0 || len >= MAX_VV) {
            snprintf(diag, diag_sz, "malformed-dependency-vector");
            return -1;
        }

        char dep_text[MAX_VV];
        memcpy(dep_text, start, len);
        dep_text[len] = 0;

        struct version_vector dep;
        if (parse_dependency_vector(dep_text, &dep, diag, diag_sz) < 0) return -1;
        if (!vv_leq(&dep, candidate)) {
            snprintf(bad_dep, bad_dep_sz, "%s", dep_text);
            snprintf(diag, diag_sz, "causal-proof-not-closed");
            return -1;
        }

        dep_count++;
        if (*p == '|') {
            p++;
            if (!*p) {
                snprintf(diag, diag_sz, "malformed-dependency-vector");
                return -1;
            }
        }
    }

    return dep_count > 0 ? 0 : -1;
}

static enum pipe_state validate_causal_proof(struct omi_frame *f,
                                             char *diag, size_t diag_sz) {
    struct mcrsgsp_fields *m = &f->mcrsgsp;
    if (!m->has_vv || m->vv[0] == 0) {
        snprintf(diag, diag_sz, "missing-version-vector;type=%s;id=%s", m->type, m->id);
        return PIPE_REJECT;
    }
    if (!m->has_proof || m->proof[0] == 0 || !m->has_requires || m->requires[0] == 0) {
        snprintf(diag, diag_sz, "missing-causal-proof;type=%s;id=%s", m->type, m->id);
        return PIPE_REJECT;
    }
    for (const char *p = m->proof; *p; p++) {
        if (isspace((unsigned char)*p)) {
            snprintf(diag, diag_sz, "missing-causal-proof;type=%s;id=%s", m->type, m->id);
            return PIPE_REJECT;
        }
    }

    struct version_vector candidate;
    char vv_diag[128];
    if (parse_version_vector(m->vv, &candidate, vv_diag, sizeof(vv_diag)) < 0) {
        snprintf(diag, diag_sz, "%s;type=%s;id=%s", vv_diag, m->type, m->id);
        return PIPE_REJECT;
    }

    char bad_dep[MAX_VV];
    bad_dep[0] = 0;
    char dep_diag[128];
    if (parse_requires_and_check(m->requires, &candidate,
                                 bad_dep, sizeof(bad_dep),
                                 dep_diag, sizeof(dep_diag)) < 0) {
        if (strcmp(dep_diag, "causal-proof-not-closed") == 0) {
            snprintf(diag, diag_sz, "%s;type=%s;id=%s;missing=%s;vv=%s",
                     dep_diag, m->type, m->id, bad_dep, m->vv);
        } else {
            snprintf(diag, diag_sz, "%s;type=%s;id=%s", dep_diag, m->type, m->id);
        }
        return PIPE_REJECT;
    }

    return PIPE_OK;
}

static int parse_frag_roots(const char *frags,
                            int n,
                            struct fragment_roots *out,
                            char *diag, size_t diag_sz) {
    memset(out, 0, sizeof(*out));
    if (!frags || !*frags) {
        snprintf(diag, diag_sz, "missing-rs-proof");
        return -1;
    }

    const char *p = frags;
    while (*p) {
        if (!isdigit((unsigned char)*p)) {
            snprintf(diag, diag_sz, "malformed-frag-root");
            return -1;
        }

        uint64_t idx = 0;
        while (*p && *p != ':') {
            if (!isdigit((unsigned char)*p)) {
                snprintf(diag, diag_sz, "malformed-frag-root");
                return -1;
            }
            idx = idx * 10u + (uint64_t)(*p - '0');
            if (idx >= MAX_FRAG_ROOTS || idx >= (uint64_t)n) {
                snprintf(diag, diag_sz, "frag-index-out-of-range");
                return -1;
            }
            p++;
        }
        if (*p != ':') {
            snprintf(diag, diag_sz, "malformed-frag-root");
            return -1;
        }
        p++;

        const char *root_start = p;
        int nibbles = 0;
        while (*p && *p != ',') {
            if (hexval(*p) < 0 || nibbles >= 8) {
                snprintf(diag, diag_sz, "malformed-frag-root");
                return -1;
            }
            nibbles++;
            p++;
        }
        if (nibbles == 0) {
            snprintf(diag, diag_sz, "malformed-frag-root");
            return -1;
        }

        if (out->present[idx]) {
            snprintf(diag, diag_sz, "duplicate-frag-index");
            return -1;
        }

        uint32_t root = 0;
        if (parse_hex_n(root_start, nibbles, &root) < 0) {
            snprintf(diag, diag_sz, "malformed-frag-root");
            return -1;
        }
        out->roots[idx] = root;
        out->present[idx] = 1;

        if (*p == ',') {
            p++;
            if (!*p) {
                snprintf(diag, diag_sz, "malformed-frag-root");
                return -1;
            }
        }
    }

    return 0;
}

static int validate_frag_subset_match(const struct fragment_roots *roots,
                                      uint64_t subset_mask,
                                      int n,
                                      int *missing_idx) {
    for (int i = 0; i < n && i < MAX_FRAG_ROOTS; i++) {
        if ((subset_mask & ((uint64_t)1 << i)) && !roots->present[i]) {
            *missing_idx = i;
            return -1;
        }
    }
    return 0;
}

static uint32_t replay_candidate_root(const struct fragment_roots *roots,
                                      uint64_t subset_mask,
                                      int n) {
    uint32_t root = 0;
    for (int i = 0; i < n && i < MAX_FRAG_ROOTS; i++) {
        if (subset_mask & ((uint64_t)1 << i)) root ^= roots->roots[i];
    }
    return root;
}

static int collect_subset_indices(uint64_t subset_mask, int n, int *indices, int max_indices) {
    int count = 0;
    for (int i = 0; i < n && i < MAX_FRAG_ROOTS; i++) {
        if (subset_mask & ((uint64_t)1 << i)) {
            if (count >= max_indices) return -1;
            indices[count++] = i;
        }
    }
    return count;
}

static uint8_t gf256_mul(uint8_t a, uint8_t b) {
    uint8_t p = 0;
    for (int i = 0; i < 8; i++) {
        if (b & 1) p ^= a;
        uint8_t hi = a & 0x80;
        a <<= 1;
        if (hi) a ^= 0x1d;
        b >>= 1;
    }
    return p;
}

static uint8_t gf256_pow(uint8_t a, uint8_t e) {
    uint8_t out = 1;
    while (e) {
        if (e & 1) out = gf256_mul(out, a);
        a = gf256_mul(a, a);
        e >>= 1;
    }
    return out;
}

static uint8_t gf256_inv(uint8_t a) {
    if (a == 0) return 0;
    return gf256_pow(a, 254);
}

static uint8_t gf256_div(uint8_t a, uint8_t b) {
    if (b == 0) return 0;
    return gf256_mul(a, gf256_inv(b));
}

static int rs_lagrange_eval_byte_at(const int *indices,
                                    const uint8_t *values,
                                    int count,
                                    int k,
                                    uint8_t x_eval,
                                    uint8_t *out) {
    if (k <= 0 || count < k) return -1;
    uint8_t acc = 0;

    for (int i = 0; i < k; i++) {
        uint8_t xi = (uint8_t)(indices[i] + 1);
        uint8_t yi = values[i];
        uint8_t num = 1;
        uint8_t den = 1;

        for (int j = 0; j < k; j++) {
            if (i == j) continue;
            uint8_t xj = (uint8_t)(indices[j] + 1);
            uint8_t diff = xi ^ xj;
            if (diff == 0) return -1;
            num = gf256_mul(num, x_eval ^ xj);
            den = gf256_mul(den, diff);
        }
        if (den == 0) return -1;
        acc ^= gf256_mul(yi, gf256_div(num, den));
    }

    *out = acc;
    return 0;
}

static int eval_gf256_root16_at(const struct fragment_roots *roots,
                                const int *basis_indices,
                                int basis_count,
                                int k,
                                uint8_t x_eval,
                                uint32_t *out) {
    uint8_t high[MAX_FRAG_ROOTS];
    uint8_t low[MAX_FRAG_ROOTS];

    if (basis_count < k || k > MAX_FRAG_ROOTS) return -1;

    for (int i = 0; i < k; i++) {
        int idx = basis_indices[i];
        if (idx < 0 || idx >= MAX_FRAG_ROOTS || !roots->present[idx]) return -1;
        uint32_t root = roots->roots[idx] & 0xffffu;
        high[i] = (uint8_t)((root >> 8) & 0xff);
        low[i] = (uint8_t)(root & 0xff);
    }

    uint8_t replay_high = 0;
    uint8_t replay_low = 0;
    if (rs_lagrange_eval_byte_at(basis_indices, high, basis_count, k, x_eval, &replay_high) < 0) return -1;
    if (rs_lagrange_eval_byte_at(basis_indices, low, basis_count, k, x_eval, &replay_low) < 0) return -1;

    *out = ((uint32_t)replay_high << 8) | replay_low;
    return 0;
}

static int replay_gf256_root16(const struct fragment_roots *roots,
                               const int *basis_indices,
                               int basis_count,
                               int k,
                               uint32_t *out) {
    return eval_gf256_root16_at(roots, basis_indices, basis_count, k, 0, out);
}

static enum pipe_state validate_xor_rs_proof(struct omi_frame *f,
                                             const struct fragment_roots *roots,
                                             uint64_t subset_mask,
                                             char *diag, size_t diag_sz) {
    struct mcrsgsp_fields *m = &f->mcrsgsp;
    int missing_idx = -1;
    if (validate_frag_subset_match(roots, subset_mask, m->n, &missing_idx) < 0) {
        snprintf(diag, diag_sz, "frag-missing-subset-index;type=%s;id=%s;idx=%d",
                 m->type, m->id, missing_idx);
        return PIPE_REJECT;
    }

    uint32_t actual = replay_candidate_root(roots, subset_mask, m->n);
    if (actual != m->candidate_root) {
        snprintf(diag, diag_sz,
                 "rs-proof-mismatch;type=%s;id=%s;expected=0x%04x;actual=0x%04x",
                 m->type, m->id, m->candidate_root, actual);
        return PIPE_REJECT;
    }

    return PIPE_OK;
}

static enum pipe_state validate_gf256_rs_proof(struct omi_frame *f,
                                               const struct fragment_roots *roots,
                                               uint64_t subset_mask,
                                               int subset_count,
                                               const int *basis_indices,
                                               int basis_count,
                                               char *diag, size_t diag_sz) {
    struct mcrsgsp_fields *m = &f->mcrsgsp;
    const char *gf_poly = m->has_gf_poly && m->gf_poly[0] ? m->gf_poly : GF256_POLY_DEFAULT;
    const char *layout = m->has_layout && m->layout[0] ? m->layout : RS_LAYOUT_ROOT16;

    if (strcmp(gf_poly, GF256_POLY_DEFAULT) != 0) {
        snprintf(diag, diag_sz, "unsupported-gf-polynomial;type=%s;id=%s;gf=%s",
                 m->type, m->id, gf_poly);
        return PIPE_REJECT;
    }
    if (strcmp(layout, RS_LAYOUT_ROOT16) != 0) {
        snprintf(diag, diag_sz, "unsupported-rs-layout;type=%s;id=%s;layout=%s",
                 m->type, m->id, layout);
        return PIPE_REJECT;
    }
    if (subset_count < m->k) {
        snprintf(diag, diag_sz, "rs-subset-less-than-k;type=%s;id=%s;k=%d;subset-count=%d",
                 m->type, m->id, m->k, subset_count);
        return PIPE_REJECT;
    }

    int missing_idx = -1;
    if (validate_frag_subset_match(roots, subset_mask, m->n, &missing_idx) < 0) {
        snprintf(diag, diag_sz, "missing-frag-for-subset-index;type=%s;id=%s;idx=%d",
                 m->type, m->id, missing_idx);
        return PIPE_REJECT;
    }

    uint32_t actual = 0;
    if (basis_count != m->k) {
        snprintf(diag, diag_sz, "basis-count-mismatch;type=%s;id=%s;k=%d;basis-count=%d",
                 m->type, m->id, m->k, basis_count);
        return PIPE_REJECT;
    }
    if (replay_gf256_root16(roots, basis_indices, basis_count, m->k, &actual) < 0) {
        snprintf(diag, diag_sz, "gf256-zero-denominator;type=%s;id=%s", m->type, m->id);
        return PIPE_REJECT;
    }

    if (actual != m->candidate_root) {
        snprintf(diag, diag_sz,
                 "gf256-rs-proof-mismatch;type=%s;id=%s;expected=0x%04x;actual=0x%04x",
                 m->type, m->id, m->candidate_root, actual);
        return PIPE_REJECT;
    }

    uint64_t basis_mask = 0;
    for (int i = 0; i < basis_count; i++) {
        if (basis_indices[i] < 0 || basis_indices[i] >= MAX_FRAG_ROOTS) {
            snprintf(diag, diag_sz, "basis-metadata-mismatch;type=%s;id=%s;k=%d",
                     m->type, m->id, m->k);
            return PIPE_REJECT;
        }
        basis_mask |= (uint64_t)1 << basis_indices[i];
    }

    for (int idx = 0; idx < m->n && idx < MAX_FRAG_ROOTS; idx++) {
        uint64_t bit = (uint64_t)1 << idx;
        if (!(subset_mask & bit) || (basis_mask & bit)) continue;

        uint32_t expected = 0;
        if (eval_gf256_root16_at(roots, basis_indices, basis_count, m->k,
                                 (uint8_t)(idx + 1), &expected) < 0) {
            snprintf(diag, diag_sz, "gf256-zero-denominator;type=%s;id=%s", m->type, m->id);
            return PIPE_REJECT;
        }
        uint32_t root = roots->roots[idx] & 0xffffu;
        if (root != expected) {
            snprintf(diag, diag_sz,
                     "gf256-extra-frag-inconsistent;type=%s;id=%s;idx=%d;expected=0x%04x;actual=0x%04x",
                     m->type, m->id, idx, expected, root);
            return PIPE_REJECT;
        }
    }

    return PIPE_OK;
}

static enum pipe_state validate_rs_proof(struct omi_frame *f,
                                         uint64_t subset_mask,
                                         int subset_count,
                                         const int *basis_indices,
                                         int basis_count,
                                         char *diag, size_t diag_sz) {
    struct mcrsgsp_fields *m = &f->mcrsgsp;
    if (!m->has_rs_mode || m->rs_mode[0] == 0) {
        snprintf(diag, diag_sz, "missing-rs-proof;type=%s;id=%s", m->type, m->id);
        return PIPE_REJECT;
    }

    struct fragment_roots roots;
    memset(&roots, 0, sizeof(roots));
    if (m->has_frags && m->frags[0] != 0) {
        char rs_diag[128];
        if (parse_frag_roots(m->frags, m->n, &roots, rs_diag, sizeof(rs_diag)) < 0) {
            snprintf(diag, diag_sz, "%s;type=%s;id=%s", rs_diag, m->type, m->id);
            return PIPE_REJECT;
        }
    } else {
        struct reconstruction_slot *slot = find_slot(m->id, m->k, m->n);
        if (!slot) {
            snprintf(diag, diag_sz, "missing-rs-proof;type=%s;id=%s", m->type, m->id);
            return PIPE_REJECT;
        }
        roots = slot->roots;
    }

    if (strcmp(m->rs_mode, RS_MODE_XOR) == 0) {
        return validate_xor_rs_proof(f, &roots, subset_mask, diag, diag_sz);
    }
    if (strcmp(m->rs_mode, RS_MODE_GF256) == 0) {
        return validate_gf256_rs_proof(f, &roots, subset_mask, subset_count,
                                       basis_indices, basis_count, diag, diag_sz);
    }

    snprintf(diag, diag_sz, "unsupported-rs-mode;type=%s;id=%s;rs=%s",
             m->type, m->id, m->rs_mode);
    return PIPE_REJECT;
}

/* Validate an omi-accept-candidate frame.  All 16 OMI authority predicates. */
static enum pipe_state validate_omi_accept_candidate(struct omi_frame *f,
                                                       char *diag, size_t diag_sz,
                                                       uint32_t *repair_cid) {
    struct mcrsgsp_fields *m = &f->mcrsgsp;

    /* 1 — id required */
    if (m->id[0] == 0) {
        snprintf(diag, diag_sz, "missing-id;type=%s", m->type);
        return PIPE_REJECT;
    }
    /* 2 — k required, non-negative */
    if (!m->has_k || m->k < 0) {
        snprintf(diag, diag_sz, "missing-k;type=%s;id=%s", m->type, m->id);
        return PIPE_REJECT;
    }
    /* 3 — n required, non-negative */
    if (!m->has_n || m->n < 0) {
        snprintf(diag, diag_sz, "missing-n;type=%s;id=%s", m->type, m->id);
        return PIPE_REJECT;
    }
    /* 4 — n <= MAX_N */
    if (m->n > MAX_N) {
        snprintf(diag, diag_sz, "n-exceeds-max;type=%s;id=%s;n=%d;max=%d", m->type, m->id, m->n, MAX_N);
        return PIPE_REJECT;
    }
    /* 5 — k <= n */
    if (m->k > m->n) {
        snprintf(diag, diag_sz, "k-greater-than-n;type=%s;id=%s;k=%d;n=%d", m->type, m->id, m->k, m->n);
        return PIPE_REJECT;
    }
    /* 6 — subset required */
    if (m->subset[0] == 0) {
        snprintf(diag, diag_sz, "missing-subset;type=%s;id=%s", m->type, m->id);
        return PIPE_REJECT;
    }
    /* 7 — subset sorted, unique, in-range */
    uint64_t submask = 0;
    int subcount = 0;
    int basis_indices[MAX_FRAG_ROOTS];
    int basis_count = 0;
    int prev_idx = -1;
    const char *sp = m->subset;
    while (*sp) {
        while (*sp == ' ' || *sp == ',') sp++;
        if (!*sp) break;
        char *end = NULL;
        long v = strtol(sp, &end, 10);
        if (end == sp || v < 0 || v >= m->n) {
            snprintf(diag, diag_sz, "invalid-subset-idx;type=%s;id=%s", m->type, m->id);
            return PIPE_REJECT;
        }
        if (v <= prev_idx) {
            snprintf(diag, diag_sz, "subset-not-sorted;type=%s;id=%s", m->type, m->id);
            return PIPE_REJECT;
        }
        uint64_t bit = (uint64_t)1 << v;
        if (submask & bit) {
            snprintf(diag, diag_sz, "subset-duplicate;type=%s;id=%s", m->type, m->id);
            return PIPE_REJECT;
        }
        submask |= bit;
        subcount++;
        prev_idx = (int)v;
        sp = end;
    }
    if (subcount < 1) {
        snprintf(diag, diag_sz, "empty-subset;type=%s;id=%s", m->type, m->id);
        return PIPE_REJECT;
    }
    /* 8 — subset count >= k */
    if (subcount < m->k) {
        if (strcmp(m->rs_mode, RS_MODE_GF256) == 0) {
            snprintf(diag, diag_sz, "rs-subset-less-than-k;type=%s;id=%s;k=%d;subset-count=%d",
                     m->type, m->id, m->k, subcount);
        } else {
            snprintf(diag, diag_sz, "subset-below-k;type=%s;id=%s;k=%d;subset-count=%d",
                     m->type, m->id, m->k, subcount);
        }
        return PIPE_REJECT;
    }

    if (m->has_basis) {
        uint64_t basis_mask = 0;
        int basis_prev_idx = -1;
        const char *bp = m->basis;
        while (*bp) {
            while (*bp == ' ' || *bp == ',') bp++;
            if (!*bp) break;
            char *end = NULL;
            long v = strtol(bp, &end, 10);
            if (end == bp || v < 0 || v >= m->n || v >= MAX_FRAG_ROOTS) {
                snprintf(diag, diag_sz, "invalid-basis-idx;type=%s;id=%s", m->type, m->id);
                return PIPE_REJECT;
            }
            if (v <= basis_prev_idx) {
                snprintf(diag, diag_sz, "basis-not-sorted;type=%s;id=%s", m->type, m->id);
                return PIPE_REJECT;
            }
            uint64_t bit = (uint64_t)1 << v;
            if (basis_mask & bit) {
                snprintf(diag, diag_sz, "basis-duplicate;type=%s;id=%s", m->type, m->id);
                return PIPE_REJECT;
            }
            if (basis_count >= MAX_FRAG_ROOTS) {
                snprintf(diag, diag_sz, "basis-metadata-mismatch;type=%s;id=%s;k=%d",
                         m->type, m->id, m->k);
                return PIPE_REJECT;
            }
            basis_mask |= bit;
            basis_indices[basis_count++] = (int)v;
            basis_prev_idx = (int)v;
            bp = end;
        }
        if (basis_count < 1) {
            snprintf(diag, diag_sz, "empty-basis;type=%s;id=%s", m->type, m->id);
            return PIPE_REJECT;
        }
        if (basis_count != m->k || (basis_mask & ~submask) != 0) {
            snprintf(diag, diag_sz, "basis-metadata-mismatch;type=%s;id=%s;k=%d",
                     m->type, m->id, m->k);
            return PIPE_REJECT;
        }
    } else {
        int collected = collect_subset_indices(submask, m->n, basis_indices, MAX_FRAG_ROOTS);
        if (collected < m->k) {
            snprintf(diag, diag_sz, "basis-count-mismatch;type=%s;id=%s;k=%d;basis-count=%d",
                     m->type, m->id, m->k, collected);
            return PIPE_REJECT;
        }
        basis_count = m->k;
    }

    /* 9 — candidate-root present */
    if (!m->has_candidate_root) {
        snprintf(diag, diag_sz, "missing-candidate-root;type=%s;id=%s", m->type, m->id);
        return PIPE_REJECT;
    }
    if (m->candidate_root_malformed) {
        snprintf(diag, diag_sz, "malformed-candidate-root;type=%s;id=%s", m->type, m->id);
        return PIPE_REJECT;
    }
    enum pipe_state rs_st = validate_rs_proof(f, submask, subcount, basis_indices, basis_count, diag, diag_sz);
    if (rs_st != PIPE_OK) return rs_st;

    enum pipe_state causal_st = validate_causal_proof(f, diag, diag_sz);
    if (causal_st != PIPE_OK) return causal_st;

    /* 10 — car, cdr, cid witness valid */
    if (f->car == 0 && f->cdr == 0 && f->cid == 0) {
        snprintf(diag, diag_sz, "missing-car-cdr-cid;type=%s;id=%s", m->type, m->id);
        return PIPE_REJECT;
    }
    if (!verify_car_cdr_cid(f->car, f->cdr, f->cid)) {
        *repair_cid = f->car ^ f->cdr;
        snprintf(diag, diag_sz,
                 "cid-mismatch;type=%s;id=%s;car=0x%04x;cdr=0x%04x;cid=0x%04x;expected-cid=0x%04x",
                 m->type, m->id, f->car, f->cdr, f->cid, *repair_cid);
        return PIPE_REPAIR;
    }

    return PIPE_OK;
}

/* Emit acceptance receipt for a validated omi-accept-candidate */
static void emit_acceptance_receipt(struct omi_frame *f) {
    struct mcrsgsp_fields *m = &f->mcrsgsp;
    char basis_part[MAX_BASIS_FIELD + 16];
    basis_part[0] = 0;
    if (m->has_basis && m->basis[0]) {
        snprintf(basis_part, sizeof(basis_part), ";basis=%s", m->basis);
    }
    if (strcmp(m->rs_mode, RS_MODE_GF256) == 0) {
        const char *gf_poly = m->has_gf_poly && m->gf_poly[0] ? m->gf_poly : GF256_POLY_DEFAULT;
        const char *layout = m->has_layout && m->layout[0] ? m->layout : RS_LAYOUT_ROOT16;
        printf("%s;type=%s;id=%s;k=%d;n=%d;subset=%s%s;candidate-root=0x%04x;rs=%s;gf=%s;layout=%s;rs-proof=replayed;vv=%s;causal=closed;scope=0x%04x;accept-seal=0x%04x\n",
               RECEIPT_OK, OMI_TYPE_ACCEPTED_CANDIDATE, m->id, m->k, m->n,
               m->subset, basis_part, m->candidate_root, m->rs_mode, gf_poly, layout, m->vv, PIPE_SCOPE, ACCEPT_SEAL);
    } else {
        printf("%s;type=%s;id=%s;k=%d;n=%d;subset=%s%s;candidate-root=0x%04x;rs=%s;rs-proof=replayed;vv=%s;causal=closed;scope=0x%04x;accept-seal=0x%04x\n",
               RECEIPT_OK, OMI_TYPE_ACCEPTED_CANDIDATE, m->id, m->k, m->n,
               m->subset, basis_part, m->candidate_root, m->rs_mode, m->vv, PIPE_SCOPE, ACCEPT_SEAL);
    }
    fflush(stdout);
}

/* Core pipeline: gauge → nomogram → relation → seal → receipt */
static enum pipe_state process_frame(struct omi_frame *f,
                                      uint32_t *gauge_cell,
                                      uint8_t *seal,
                                      char *diag, size_t diag_sz) {
    uint8_t row = f->control >> 4;
    uint8_t x   = f->frame_count > 0 ? f->frame_bytes[0] : 0;
    uint8_t y   = f->frame_count > 1 ? f->frame_bytes[1] : 0;
    *gauge_cell = omi_gauge_cell(row, x, y);

    if ((f->scale & 0xF0) != 0x30) {
        snprintf(diag, diag_sz, "invalid-nomogram-scale:0x%02x", f->scale);
        return PIPE_REJECT;
    }

    uint8_t mirror = two_cube_mirror(f->relation);
    uint8_t delta  = two_cube_delta(f->relation, mirror);
    if (delta == 0) {
        snprintf(diag, diag_sz, "identity-relation:no-transition");
        return PIPE_REJECT;
    }

    if ((f->relation & 0xF0) != 0x70) {
        snprintf(diag, diag_sz,
                 "out-of-pipe-scope:relation=0x%02x;expected-pipe=0x7x",
                 f->relation);
        return PIPE_REJECT;
    }

    if (f->scale == MCRSGSP_SCALE && f->has_query) {
        uint32_t repair_cid = 0;
        enum pipe_state mcrsgsp_st = validate_mcrsgsp(f, diag, diag_sz, &repair_cid);
        if (mcrsgsp_st != PIPE_OK) return mcrsgsp_st;
    }

    if (f->has_query) {
        if (!verify_car_cdr_cid(f->car, f->cdr, f->cid)) {
            snprintf(diag, diag_sz,
                     "car-cdr-cid-mismatch:car=0x%04x;cdr=0x%04x;cid=0x%04x",
                     f->car, f->cdr, f->cid);
            uint32_t repair_cid = f->car ^ f->cdr;
            snprintf(diag + strlen(diag), diag_sz - strlen(diag),
                     ";repair-cid=0x%04x", repair_cid);
            return PIPE_REPAIR;
        }
    }

    *seal = (uint8_t)((*gauge_cell & 0xFF) ^ f->relation ^ f->control);
    if ((*seal & 0x55) != 0x55) {
        snprintf(diag, diag_sz,
                 "seal-rejected:seal-byte=0x%02x;expected=0x55",
                 *seal);
        return PIPE_REJECT;
    }

    return PIPE_OK;
}

/* Build MCRSGSP-specific suffix for receipt */
static void append_mcrsgsp_receipt_fields(const struct omi_frame *f,
                                           char *buf, size_t bufsz) {
    const struct mcrsgsp_fields *m = &f->mcrsgsp;
    size_t pos = strlen(buf);
    int remaining = bufsz - pos - 1;
    if (remaining < 0) return;

    if (m->type[0]) {
        int n = snprintf(buf + pos, remaining, ";type=%s", m->type);
        if (n > 0) { pos += n; remaining = bufsz - pos - 1; if (remaining < 0) return; }
    }
    if (m->id[0]) {
        int n = snprintf(buf + pos, remaining, ";id=%s", m->id);
        if (n > 0) { pos += n; remaining = bufsz - pos - 1; if (remaining < 0) return; }
    }
    if (m->has_idx && m->idx >= 0) {
        int n = snprintf(buf + pos, remaining, ";idx=%d", m->idx);
        if (n > 0) { pos += n; remaining = bufsz - pos - 1; if (remaining < 0) return; }
    }
    if (m->has_k && m->k >= 0) {
        int n = snprintf(buf + pos, remaining, ";k=%d", m->k);
        if (n > 0) { pos += n; remaining = bufsz - pos - 1; if (remaining < 0) return; }
    }
    if (m->has_n && m->n >= 0) {
        int n = snprintf(buf + pos, remaining, ";n=%d", m->n);
        if (n > 0) { pos += n; remaining = bufsz - pos - 1; if (remaining < 0) return; }
    }
    if (m->vv[0]) {
        int n = snprintf(buf + pos, remaining, ";vv=%s", m->vv);
        if (n > 0) { pos += n; remaining = bufsz - pos - 1; if (remaining < 0) return; }
    }
    if (m->peer[0]) {
        int n = snprintf(buf + pos, remaining, ";peer=%s", m->peer);
        if (n > 0) { pos += n; remaining = bufsz - pos - 1; if (remaining < 0) return; }
    }
    if (m->missing[0]) {
        int n = snprintf(buf + pos, remaining, ";missing=%s", m->missing);
        if (n > 0) { pos += n; remaining = bufsz - pos - 1; if (remaining < 0) return; }
    }
}

static void emit_receipt(struct omi_frame *f,
                          uint32_t gauge_cell,
                          uint8_t seal,
                          const char *nomogram_name) {
    char extra[512];
    extra[0] = 0;
    append_mcrsgsp_receipt_fields(f, extra, sizeof(extra));

    printf("%s;scope=0x%04x;accept-seal=0x%04x;seal-byte=0x%02x;gauge-cell=0x%04x;"
           "nomogram=%s;nomogram-scale=0x%02x;"
           "frame-bytes=%d;control=0x%02x;relation=0x%02x;unit=0x%02x;"
           "car=0x%04x;cdr=0x%04x;cid=0x%04x%s\n",
           RECEIPT_OK,
           PIPE_SCOPE,
           ACCEPT_SEAL,
           seal,
           gauge_cell,
           nomogram_name, f->scale,
           f->frame_count, f->control, f->relation, f->unit,
           f->car, f->cdr, f->cid,
           extra);
    fflush(stdout);
}

static void emit_reject(const char *diagnostic, struct omi_frame *f) {
    fprintf(stderr, "%s%s;scope=0x%04x;input=%s\n",
            RECEIPT_REJ, diagnostic, PIPE_SCOPE, f->raw);
    fflush(stderr);
}

static void emit_repair(const char *diagnostic, struct omi_frame *f) {
    fprintf(stderr, "%s%s;scope=0x%04x;input=%s\n",
            RECEIPT_RPR, diagnostic, PIPE_SCOPE, f->raw);
    fflush(stderr);
}

int main(int argc, char **argv) {
    char line[MAX_LINE];
    int line_no = 0;
    int accepted = 0, rejected = 0, repaired = 0, candidates = 0;
    memset(g_slots, 0, sizeof(g_slots));
    g_slot_count = 0;

    FILE *in = stdin;
    if (argc > 1) {
        in = fopen(argv[1], "r");
        if (!in) {
            fprintf(stderr, "omi-reject:file-not-found;path=%s\n", argv[1]);
            return 1;
        }
    }

    while (fgets(line, sizeof(line), in)) {
        line_no++;
        size_t len = strlen(line);
        while (len > 0 && (line[len-1] == '\n' || line[len-1] == '\r'))
            line[--len] = 0;
        if (len == 0 || line[0] == '#') continue;

        struct omi_frame frame;
        if (parse_omi_line(line, &frame) < 0) {
            fprintf(stderr, "%sparse-error;scope=0x%04x;line=%d;input=%s\n",
                    RECEIPT_REJ, PIPE_SCOPE, line_no, line);
            rejected++;
            continue;
        }

        uint32_t gauge_cell = 0;
        uint8_t seal = 0;
        char diag[512];

        enum pipe_state st = process_frame(&frame, &gauge_cell, &seal,
                                            diag, sizeof(diag));

        const char *nom_name = omi_nomogram_name(frame.scale);

        switch (st) {
            case PIPE_OK:
                if (strcmp(frame.mcrsgsp.type, OMI_TYPE_ACCEPT_CANDIDATE) == 0) {
                    emit_acceptance_receipt(&frame);
                } else {
                    emit_receipt(&frame, gauge_cell, seal, nom_name);
                    /* After fragment receipt, check if reconstruction threshold reached */
                    if (frame.scale == MCRSGSP_SCALE &&
                        frame.has_query &&
                        strcmp(frame.mcrsgsp.type, MCRSGSP_TYPE_FRAG) == 0 &&
                        frame.mcrsgsp.has_k && frame.mcrsgsp.has_n &&
                        frame.mcrsgsp.k > 0 && frame.mcrsgsp.n > 0 &&
                        frame.mcrsgsp.has_idx && frame.mcrsgsp.idx >= 0 &&
                        frame.mcrsgsp.id[0]) {

                        struct reconstruction_slot *slot = find_or_create_slot(
                            frame.mcrsgsp.id, frame.mcrsgsp.k, frame.mcrsgsp.n);
                        if (slot) {
                            if (update_reconstruction(slot, frame.mcrsgsp.idx, frame.car)) {
                                emit_candidate_receipt(slot);
                                candidates++;
                            }
                        }
                    }
                }
                accepted++;
                break;
            case PIPE_REJECT:
                emit_reject(diag, &frame);
                rejected++;
                break;
            case PIPE_REPAIR:
                emit_repair(diag, &frame);
                repaired++;
                break;
            case PIPE_CANDIDATE:
                /* unused — candidate is emitted inline above */
                break;
        }
    }

    fprintf(stderr, "omi-pipe-summary;scope=0x%04x;accepted=%d;rejected=%d;repaired=%d;candidates=%d\n",
            PIPE_SCOPE, accepted, rejected, repaired, candidates);

    if (in != stdin) fclose(in);
    return rejected > 0 ? 1 : 0;
}
