export function scoreNodeWithPolicy(node, outputs = []) {
  // Stable fallback policy: TinyNEAT genomes may override this with process().
  const base = node.executable ? 1 : 0;
  const channelBias = node.channel === "US" ? 0.25 : node.channel === "RS" ? 0.5 : node.channel === "GS" ? 0.75 : 1;
  const neatSignal = Array.isArray(outputs) && outputs.length ? Number(outputs[0]) : 0;
  return base + channelBias + neatSignal;
}

export async function makeTinyNEATPolicy(inputSize, outputSize = 1, overrides = {}) {
  // TinyNEAT is optional at runtime so the package can still build/test without a trained population.
  const mod = await import("tinyneat");
  const TinyNEAT = mod.TinyNEAT || mod.default || mod.tinyneat;
  const plugins = mod.plugins || {};
  const config = {
    inputSize,
    outputSize,
    initialPopulationSize: 50,
    maxGenerations: 50,
    fitnessSort: "max",
    ...(plugins.ANNPlugin ? { nnPlugin: plugins.ANNPlugin() } : {}),
    ...overrides
  };
  const tn = TinyNEAT(config);
  return {
    engine: tn,
    evaluate(nodes) {
      const population = tn.getPopulationIndexed();
      for (const [, genome] of population) {
        genome.fitness = 0;
        for (const node of nodes) {
          const inputs = [
            node.feature.normalizedIndex,
            node.feature.tokenLength / 32,
            ...node.feature.channelOneHot
          ].slice(0, inputSize);
          const outputs = genome.process(inputs);
          genome.fitness += scoreNodeWithPolicy(node, outputs);
        }
      }
      tn.evolve();
      return tn.getBestGenomes()[0];
    }
  };
}
