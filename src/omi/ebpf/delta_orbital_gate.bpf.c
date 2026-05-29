#include <linux/bpf.h>
#include <linux/if_ether.h>
#include <linux/ipv6.h>
#include <bpf/bpf_helpers.h>

#define OMI_MAX_VALID_STEPS  14

/* Bitwise register rotation macros mapping directly to hardware bit-shifts */
#define ROTL16(x, n)  (((x) << (n)) | ((x) >> (16 - (n))))
#define ROTR16(x, n)  (((x) >> (n)) | ((x) << (16 - (n))))

/* In-line macro executing a single entropy-preserving Δ_C step */
#define DELTA_C_STEP(x, c)  ((ROTL16(x, 1) ^ ROTL16(x, 3) ^ ROTR16(x, 2) ^ (c)) & 0xFFFF)

SEC("xdp")
int omi_ingress_packet_filter(struct xdp_md *ctx)
{
	void *data_end = (void *)(long)ctx->data_end;
	void *data     = (void *)(long)ctx->data;

	/* 1. Parse network headers — isolate incoming IPv6 packets */
	struct ethhdr *eth = data;
	if ((void *)(eth + 1) > data_end)
		return XDP_PASS;

	if (eth->h_proto != __constant_htons(ETH_P_IPV6))
		return XDP_PASS;

	struct ipv6hdr *ip6 = (void *)(eth + 1);
	if ((void *)(ip6 + 1) > data_end)
		return XDP_PASS;

	/*
	 * 2. Zero-copy frame extraction:
	 *    The 128-bit IPv6 source address IS the OMI instruction word.
	 *    Map directly as uint16_t[8] — network byte order, no copy.
	 */
	__u16 *S = (__u16 *)&ip6->saddr;
	if ((void *)(S + 8) > data_end)
		return XDP_PASS;

	/* ===== GATE 1: QUADRATIC ERROR SURFACE ===== */

	__u32 ll0 = (S[0] >> 8) & 0xFF;
	__u32 ll3 =  S[3]        & 0xFF;
	__u32 ll4 =  S[4]        & 0xFF;
	__u32 ll7 = (S[7] >> 8)  & 0xFF;

	__u32 d03 = ll0 - ll3;
	__u32 d34 = ll3 - ll4;
	__u32 d47 = ll4 - ll7;
	__u32 E_var = (d03 * d03) + (d34 * d34) + (d47 * d47);

	__u32 c0 = (S[0] & 0x00FF);
	__u32 c1 =  S[1]        - 0x03BF;
	__u32 c3 = (S[3] & 0xFF00) - 0x2B00;
	__u32 c4 = (S[4] & 0xFF00) - 0x2F00;
	__u32 c6 =  S[6]        - 0x039F;
	__u32 c7 = (S[7] & 0x00FF) - 0xFF;

	__u32 E_const = (c0 * c0) + (c1 * c1) + (c3 * c3) +
			(c4 * c4) + (c6 * c6) + (c7 * c7);

	if (E_var + E_const != 0)
		return XDP_DROP;  /* Gate 1 fault — evict at NIC */

	/* ===== GATE 2: FANO PROJECTIVE CLOSURE RESOLUTION ===== */

	/* Strict Fano plane point binding (0x01..0x07) */
	if (ll0 < 1 || ll0 > 7)
		return XDP_DROP;

	__u16 state  = S[2];  /* NN: antecedent vector */
	__u16 target = S[5];  /* MM: consequent vector */
	__u16 C = (ll0 * 0x1337) & 0xFFFF;

	/* Step 0: NN already equals MM */
	if (state == target)
		return XDP_PASS;

	/*
	 * Manually unrolled Δ_C trajectory.
	 * Each step: apply DELTA_C_STEP, compare to target.
	 * BPF verifier sees fixed 14 conditional branches — no loops to verify.
	 */
	state = DELTA_C_STEP(state, C); if (state == target) return XDP_PASS;
	state = DELTA_C_STEP(state, C); if (state == target) return XDP_PASS;
	state = DELTA_C_STEP(state, C); if (state == target) return XDP_PASS;
	state = DELTA_C_STEP(state, C); if (state == target) return XDP_PASS;
	state = DELTA_C_STEP(state, C); if (state == target) return XDP_PASS;
	state = DELTA_C_STEP(state, C); if (state == target) return XDP_PASS;
	state = DELTA_C_STEP(state, C); if (state == target) return XDP_PASS;
	state = DELTA_C_STEP(state, C); if (state == target) return XDP_PASS;
	state = DELTA_C_STEP(state, C); if (state == target) return XDP_PASS;
	state = DELTA_C_STEP(state, C); if (state == target) return XDP_PASS;
	state = DELTA_C_STEP(state, C); if (state == target) return XDP_PASS;
	state = DELTA_C_STEP(state, C); if (state == target) return XDP_PASS;
	state = DELTA_C_STEP(state, C); if (state == target) return XDP_PASS;
	state = DELTA_C_STEP(state, C); if (state == target) return XDP_PASS;

	/* Gate 2 divergence — resolution exceeded 14 steps */
	return XDP_DROP;
}

char _license[] SEC("license") = "GPL";
