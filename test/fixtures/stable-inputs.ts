// Inputs for the stableStringify and canonicalHash vectors. The expected
// outputs in stable-vectors.json come from the source implementation
// (hiveminds-playground src/api/serialize.ts at
// d5f58c6f0ef51ef21b27ac1568c9c8ac600f1ca9) run on exactly these inputs.
export const STABLE_INPUTS: [string, unknown][] = [
  ['null', null],
  ['true', true],
  ['zero', 0],
  ['negative float', -12.5],
  ['large integer', 12_000_000],
  ['string', 'flock'],
  ['string with quotes and unicode', 'a "quote" and é and 🐦'],
  ['empty object', {}],
  ['empty array', []],
  ['flat object, keys out of order', { b: 2, a: 1, c: 3 }],
  ['same object, other key order', { c: 3, a: 1, b: 2 }],
  ['nested objects', { outer: { z: 1, a: { y: true, b: null } }, first: 'x' }],
  ['array order is kept', [3, 1, 2]],
  ['array of objects', [{ b: 1, a: 2 }, { d: [2, 1], c: { f: 1, e: 0 } }]],
  ['object with array values', { runs: [{ seed: 7, n: 120 }], claims: [] }],
  ['numeric-like keys', { '10': 'ten', '2': 'two', '1': 'one' }],
  ['undefined property (source writes "undefined")', { a: undefined, b: 1 }],
  ['NaN becomes null', { value: Number.NaN }],
  [
    'trace-like record',
    {
      metrics: { polarization: 0.9123, cluster_count: 1, mean_neighbor_distance: 15.02 },
      tick: 2000,
      params: { separation: 0.5, noise: 0.1, cohesion: 0.5, alignment: 0.5, n: 120 },
    },
  ],
]
