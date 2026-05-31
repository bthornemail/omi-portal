#include <linux/bpf.h>
#include <linux/in.h>
#include <linux/if_ether.h>
#include <linux/ip.h>
#include <linux/ipv6.h>
#include <bpf/bpf_helpers.h>

struct {
    __uint(type, BPF_MAP_TYPE_ARRAY);
    __type(key, __u32);
    __type(value, __u64);
    __uint(max_entries, 64);
} omi_telemetry_map SEC(".maps");

SEC("xdp")
int omi_ingress_signature_gate(struct xdp_md *ctx) {
    void *data_end = (void *)(long)ctx->data_end;
    void *data = (void *)(long)ctx->data;

    struct ethhdr *eth = data;
    if ((void *)(eth + 1) > data_end)
        return XDP_PASS;

    if (eth->h_proto != __constant_htons(ETH_P_IPV6))
        return XDP_PASS;

    struct ipv6hdr *ip6 = (void *)(eth + 1);
    if ((void *)(ip6 + 1) > data_end)
        return XDP_PASS;

    __u64 saddr_low = ip6->saddr.s6_addr32[3];

    __u64 rotl1 = (saddr_low << 1) | (saddr_low >> 63);
    __u64 rotl3 = (saddr_low << 3) | (saddr_low >> 61);
    __u64 rotr2 = (saddr_low >> 2) | (saddr_low << 62);

    __u64 expected_signature = rotl1 ^ rotl3 ^ rotr2 ^ 0x1337C0DE;

    __u32 *payload_sig = (void *)(ip6 + 1);
    if ((void *)(payload_sig + 1) > data_end)
        return XDP_PASS;

    if (*payload_sig != (__u32)expected_signature)
        return XDP_DROP;

    __u32 map_key = 0;
    __u64 *counter = bpf_map_lookup_elem(&omi_telemetry_map, &map_key);
    if (counter)
        __sync_fetch_and_add(counter, 1);

    return XDP_TX;
}

char _license[] SEC("license") = "GPL";
