/*
 * OMI C99 conformance mirror for OmiAxiomaticKernel.verifyPacketCompliance().
 *
 * This layer is intentionally portable ISO C99: no heap allocation, no runtime
 * dependencies, and no architecture-specific assembly.
 */
#ifndef OMI_AXIOMATIC_H
#define OMI_AXIOMATIC_H

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#define OMI_PREFIX_STR "omi-"
#define OMI_PREFIX_LEN 4
#define OMI_SEGMENTS 8
#define OMI_RING_SLOTS 5040u

typedef struct {
  uint16_t segments[OMI_SEGMENTS];
  uint8_t cidr_mask;
  uint16_t target_slot_offset;
  bool has_projective_suffix;
  bool is_ratio_suffix;
  bool is_hard_reset;
  bool is_chiral;
  bool is_cardinal;
  bool has_inversion_gate;
  bool is_nil_terminator;
} omi_packet_meta_t;

bool omi_parse_packet(const char *token, omi_packet_meta_t *out_meta);
bool omi_verify_packet_compliance(const omi_packet_meta_t *meta);
bool omi_verify_token(const char *token, omi_packet_meta_t *out_meta);
uint16_t omi_calculate_reciprocal_slot(uint16_t n, uint16_t m);

#endif
