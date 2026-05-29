#include "../src/omi/axiomatic.h"

#include <assert.h>
#include <stdio.h>

static int verify_cli_tokens(int argc, char **argv) {
  for (int i = 1; i < argc; i++) {
    omi_packet_meta_t meta;
    const bool ok = omi_verify_token(argv[i], &meta);
    printf("%d %u %u %u\n",
           ok ? 1 : 0,
           (unsigned int)meta.target_slot_offset,
           meta.is_hard_reset ? 1u : 0u,
           meta.has_projective_suffix ? 1u : 0u);
  }
  return 0;
}

int main(int argc, char **argv) {
  if (argc > 1) return verify_cli_tokens(argc, argv);

  printf("[Omi C99 Substrate] Initiating baseline validation pass...\n");

  const char *valid_token = "omi-039f-0002-5a3c-000f-02d0-0036-0000-0000/48";
  omi_packet_meta_t meta1;
  assert(omi_parse_packet(valid_token, &meta1));
  assert(meta1.is_cardinal == true);
  assert(meta1.has_inversion_gate == true);
  assert(meta1.cidr_mask == 48);
  assert(omi_verify_packet_compliance(&meta1));
  printf("  - Test 1 Passed: Valid IPv6-CIDR/48 packet verified accurate.\n");

  const char *bad_token = "omi-0000-0000-invalid-0000-0000-0000-0000-0000/48";
  omi_packet_meta_t meta2;
  assert(omi_parse_packet(bad_token, &meta2) == false);
  printf("  - Test 2 Passed: Spoofed string token blocked successfully.\n");

  const uint16_t slot_alpha = omi_calculate_reciprocal_slot(1, 2);
  const uint16_t slot_beta = omi_calculate_reciprocal_slot(2, 1);
  assert(slot_alpha == slot_beta);
  printf("  - Test 3 Passed: Reciprocal ratio symmetry mapping confirmed.\n");

  const char *hard_reset = "omi-0064-ff9b-0000-0000-0000-0000-0000-0000/96/5040";
  omi_packet_meta_t meta3;
  assert(omi_verify_token(hard_reset, &meta3));
  assert(meta3.target_slot_offset == 0);
  assert(meta3.is_hard_reset == true);
  printf("  - Test 4 Passed: /96/5040 suffix maps to hard-reset slot zero.\n");

  printf("============================================================================\n");
  printf("C99 SUBSTRATE OPERATIONAL: conformance mirror verified green.\n");
  printf("============================================================================\n");
  return 0;
}
