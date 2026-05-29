#include "axiomatic.h"

static bool parse_hex4(const char *str, uint16_t *out_val) {
  uint32_t val = 0;
  for (int i = 0; i < 4; i++) {
    const char c = str[i];
    val <<= 4;
    if (c >= '0' && c <= '9') {
      val |= (uint32_t)(c - '0');
    } else if (c >= 'a' && c <= 'f') {
      val |= (uint32_t)(c - 'a' + 10);
    } else if (c >= 'A' && c <= 'F') {
      val |= (uint32_t)(c - 'A' + 10);
    } else {
      return false;
    }
  }
  *out_val = (uint16_t)val;
  return true;
}

static bool parse_u32_decimal(const char **cursor, uint32_t *out_val) {
  uint32_t val = 0;
  bool saw_digit = false;

  while (**cursor >= '0' && **cursor <= '9') {
    saw_digit = true;
    val = (val * 10u) + (uint32_t)(**cursor - '0');
    (*cursor)++;
  }

  if (!saw_digit) return false;
  *out_val = val;
  return true;
}

uint16_t omi_calculate_reciprocal_slot(uint16_t n, uint16_t m) {
  if (n == 0 || m == 0) return 0;
  return (uint16_t)(((uint32_t)n * (uint32_t)m * 120u) % OMI_RING_SLOTS);
}

bool omi_parse_packet(const char *token, omi_packet_meta_t *out_meta) {
  if (!token || !out_meta) return false;

  *out_meta = (omi_packet_meta_t){0};

  for (int i = 0; i < OMI_PREFIX_LEN; i++) {
    if (token[i] != OMI_PREFIX_STR[i]) return false;
  }

  const char *cursor = token + OMI_PREFIX_LEN;

  for (int i = 0; i < OMI_SEGMENTS; i++) {
    if (!parse_hex4(cursor, &out_meta->segments[i])) return false;
    cursor += 4;
    if (i < OMI_SEGMENTS - 1) {
      if (*cursor != '-') return false;
      cursor++;
    }
  }

  if (*cursor != '/') return false;
  cursor++;

  uint32_t mask = 0;
  if (!parse_u32_decimal(&cursor, &mask) || mask > 128u) return false;
  out_meta->cidr_mask = (uint8_t)mask;

  if (*cursor == '/') {
    uint32_t first = 0;
    cursor++;
    if (!parse_u32_decimal(&cursor, &first)) return false;

    out_meta->has_projective_suffix = true;

    if (*cursor == '-') {
      uint32_t second = 0;
      cursor++;
      if (!parse_u32_decimal(&cursor, &second)) return false;
      if (first == 0 || second == 0 || first > UINT16_MAX || second > UINT16_MAX) {
        return false;
      }
      out_meta->is_ratio_suffix = true;
      out_meta->target_slot_offset = omi_calculate_reciprocal_slot((uint16_t)first, (uint16_t)second);
    } else {
      out_meta->target_slot_offset = (uint16_t)(first % OMI_RING_SLOTS);
      out_meta->is_hard_reset = (first == OMI_RING_SLOTS);
    }
  }

  if (*cursor != '\0') return false;

  out_meta->is_chiral = (out_meta->segments[0] == 0xFFFFu);
  out_meta->is_cardinal = (out_meta->segments[0] == 0x039Fu);
  out_meta->has_inversion_gate = (out_meta->segments[2] == 0x5A3Cu);
  out_meta->is_nil_terminator = (out_meta->segments[7] == 0x0001u);

  return true;
}

bool omi_verify_packet_compliance(const omi_packet_meta_t *meta) {
  if (!meta) return false;

  if (meta->segments[2] != 0x0000u && meta->segments[2] != 0x5A3Cu) return false;
  if (meta->segments[4] != 0x0000u &&
      meta->segments[4] != 0x0078u &&
      meta->segments[4] != 0x02D0u &&
      meta->segments[4] != 0x13B0u) {
    return false;
  }
  if (meta->segments[5] > 0x0036u) return false;
  if (meta->segments[6] > 0x0007u) return false;
  if (meta->segments[7] > 0x0001u) return false;

  return true;
}

bool omi_verify_token(const char *token, omi_packet_meta_t *out_meta) {
  omi_packet_meta_t local_meta;
  omi_packet_meta_t *meta = out_meta ? out_meta : &local_meta;
  if (!omi_parse_packet(token, meta)) {
    *meta = (omi_packet_meta_t){0};
    return false;
  }
  if (!omi_verify_packet_compliance(meta)) {
    meta->target_slot_offset = 0;
    meta->is_hard_reset = false;
    meta->has_projective_suffix = false;
    meta->is_ratio_suffix = false;
    return false;
  }
  return true;
}
