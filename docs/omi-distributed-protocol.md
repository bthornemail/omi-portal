# OMI Distributed Protocol Prospectus

This prospectus extends the canonical [OMI Object Model](./omi-object-model.md) with the distributed protocol verification model. It is a documentation specification, not a claim that every future runtime surface is implemented.

## System Topology

OMI maps a sparse radix trie onto IPv6-style address components. A subnet boundary `X/n` defines a strict interval:

```text
IPv4: [x * 2^(32-n),  x * 2^(32-n)  + 2^(32-n)  - 1]
IPv6: [x * 2^(128-n), x * 2^(128-n) + 2^(128-n) - 1]
```

For a fixed prefix length, subnets form a partition. Any two subnets are either disjoint or nested. OMI mirrors this property with hyphen-delimited token prefixes, so DOM ancestry and CSSOM prefix selection can behave like route-table containment:

```css
[data-omi^="omi-ffff"] {}
[data-omi^="omi-ffff-127-0-0-1"] {}
```

The canonical local context boundary remains:

```text
::ffff:127.0.0.1  ->  omi-ffff-127-0-0-1

4. Context normalization: generated local addresses use `omi-ffff-127-0-0-1`.
5. Service-bus labeling: semantic content routes identify `::1..::8`; WordNet routes use `::3`; TURN proxy routes use `::4`.

This prospectus is represented structurally in [omi-object-model.manifest.json](./omi-object-model.manifest.json).
