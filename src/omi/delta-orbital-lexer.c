#include <stdint.h>
#include <stdbool.h>

#define DELTA_C_CONSTANT 0x5A3Cu
#define CHIRAL_DELIMITER 0x03BFu
#define CARDINAL_DELIMITER 0x039Fu
#define FANO_POINTS 7
#define FANO_RESOLUTION_MAX 15
#define SEGMENT_COUNT 8
#define S3_HIGH_MASK 0x2B00u
#define S4_HIGH_MASK 0x2F00u

static uint16_t rotl16(uint16_t x, int n) {
  return (x << n) | (x >> (16 - n));
}

static uint16_t rotr16(uint16_t x, int n) {
  return (x >> n) | (x << (16 - n));
}

uint16_t deltaC(uint16_t x, uint16_t C) {
  return rotl16(x, 1) ^ rotl16(x, 3) ^ rotr16(x, 2) ^ C;
}

uint16_t deltaCEightInner(uint16_t n, uint16_t C) {
  uint16_t s = n;
  s = deltaC(s, C);
  s = deltaC(s, C);
  s = deltaC(s, C);
  s = deltaC(s, C);
  s = deltaC(s, C);
  s = deltaC(s, C);
  s = deltaC(s, C);
  s = deltaC(s, C);
  return s;
}

bool isPeriodEight(uint16_t C) {
  for (uint32_t i = 0; i < 65536; i++) {
    if (deltaCEightInner((uint16_t)i, C) != (uint16_t)i) return false;
  }
  return true;
}

static bool isFanoPoint(uint8_t LL) {
  return LL >= 1 && LL <= FANO_POINTS;
}

static const uint8_t FANO_TABLE[7][3] = {
  {1, 2, 3},
  {1, 4, 5},
  {1, 6, 7},
  {2, 4, 6},
  {2, 5, 7},
  {3, 4, 7},
  {3, 5, 6}
};

int fanoTruthResolver(uint8_t LL, uint16_t NN, uint16_t MM) {
  if (!isFanoPoint(LL)) return -1;

  uint16_t C = (uint16_t)((uint32_t)LL * 0x1337u) & 0xFFFFu;
  uint16_t state = NN;
  uint16_t target = MM;

  if (state == target) return 0;

  for (int step = 1; step <= 14; step++) {
    state = deltaC(state, C);
    if (state == target) return step;
  }

  return -1;
}

uint16_t makeGenesisTarget(uint8_t LL, uint16_t NN) {
  if (!isFanoPoint(LL)) return 0;
  uint16_t C = (uint16_t)((uint32_t)LL * 0x1337u) & 0xFFFFu;
  return deltaC(NN, C);
}

int verifyOrbitLexer(const uint16_t S[8]) {
  uint8_t LL_s0 = (uint8_t)(S[0] >> 8);
  uint8_t LL_s3 = (uint8_t)(S[3] & 0xFF);
  uint8_t LL_s4 = (uint8_t)(S[4] & 0xFF);
  uint8_t LL_s7 = (uint8_t)(S[7] >> 8);

  int32_t d03 = (int32_t)LL_s0 - (int32_t)LL_s3;
  int32_t d34 = (int32_t)LL_s3 - (int32_t)LL_s4;
  int32_t d47 = (int32_t)LL_s4 - (int32_t)LL_s7;

  int32_t E_var = d03 * d03 + d34 * d34 + d47 * d47;

  int32_t d_cbos = (int32_t)(S[0] & 0xFF);
  int32_t d_chiral = (int32_t)S[1] - (int32_t)CHIRAL_DELIMITER;
  int32_t d_s3h = (int32_t)(S[3] & 0xFF00) - (int32_t)S3_HIGH_MASK;
  int32_t d_s4h = (int32_t)(S[4] & 0xFF00) - (int32_t)S4_HIGH_MASK;
  int32_t d_cardinal = (int32_t)S[6] - (int32_t)CARDINAL_DELIMITER;
  int32_t d_closure = (int32_t)(S[7] & 0xFF) - 0xFF;

  int32_t E_const = d_cbos * d_cbos + d_chiral * d_chiral +
                    d_s3h * d_s3h + d_s4h * d_s4h +
                    d_cardinal * d_cardinal + d_closure * d_closure;

  return (int)(E_var + E_const);
}

int verifyOrbitLexerDiagnostic(const uint16_t S[8]) {
  int err = 0;

  uint8_t LL_s0 = (uint8_t)(S[0] >> 8);
  uint8_t LL_s3 = (uint8_t)(S[3] & 0xFF);
  uint8_t LL_s4 = (uint8_t)(S[4] & 0xFF);
  uint8_t LL_s7 = (uint8_t)(S[7] >> 8);

  if (LL_s0 != LL_s3 || LL_s0 != LL_s4 || LL_s0 != LL_s7) {
    err |= 1;
  }

  uint8_t LL = LL_s0;

  if ((S[0] & 0x00FF) != 0x00) err |= 2;
  if (S[1] != CHIRAL_DELIMITER) err |= 4;
  if (S[6] != CARDINAL_DELIMITER) err |= 8;
  if ((S[7] & 0x00FF) != 0xFF) err |= 16;

  return err;
}

int verifyOrbitLexerQuadratic(const uint16_t S[8]) {
  int qerr = verifyOrbitLexer(S);
  if (qerr) return qerr;

  uint8_t LL = (uint8_t)(S[0] >> 8);
  uint16_t NN = S[2];
  uint16_t MM = S[5];

  int steps = fanoTruthResolver(LL, NN, MM);
  if (steps < 0 || steps >= FANO_RESOLUTION_MAX) {
    return qerr + 100000;
  }

  return qerr;
}

int generateDeltaCOrbit(uint16_t start, uint16_t C, uint16_t *out, int maxLen) {
  uint16_t x = start;
  int len = 0;
  do {
    if (len >= maxLen) break;
    if (out) out[len] = x;
    len++;
    x = deltaC(x, C);
  } while (x != start && len < maxLen);
  return len;
}

int fanoIntercept(uint16_t a, uint16_t b, uint16_t C) {
  uint16_t x = a;
  uint16_t y = b;
  for (int i = 0; i < FANO_RESOLUTION_MAX; i++) {
    if (x == y) return i;
    x = deltaC(x, C);
    y = deltaC(y, C);
  }
  return -1;
}

uint8_t fanoIntersectionPoint(uint8_t LL1, uint8_t LL2) {
  if (LL1 == LL2 || !isFanoPoint(LL1) || !isFanoPoint(LL2)) return 0;

  for (int i = 0; i < FANO_POINTS; i++) {
    if ((FANO_TABLE[LL1 - 1][0] == i + 1 || FANO_TABLE[LL1 - 1][1] == i + 1 || FANO_TABLE[LL1 - 1][2] == i + 1) &&
        (FANO_TABLE[LL2 - 1][0] == i + 1 || FANO_TABLE[LL2 - 1][1] == i + 1 || FANO_TABLE[LL2 - 1][2] == i + 1)) {
      return (uint8_t)(i + 1);
    }
  }
  return 0;
}
