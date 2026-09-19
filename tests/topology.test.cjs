const test = require("node:test");
const assert = require("node:assert/strict");
const Model = require("../src/graph-core.js");
const Topology = require("../src/topology.js");

function graph(ids, pairs) {
  const g = Model.enrich({ nodes: ids.map(id => ({ id, label: id, category: "node", properties: {} })), edges: pairs.map((pair, i) => ({ id: `e${i}`, source: pair[0], target: pair[1], type: "link", weight: pair[2] ?? .5, directed: true })) });
  g.edges.forEach(e => { e.filterWeight = e.weight; });
  return g;
}

test("directed enrichment exposes recursive upstream and downstream context", () => {
  const g = graph(["a", "b", "c", "d"], [["a", "b"], ["b", "c"], ["c", "d"]]);
  assert.deepEqual(Array.from(g.getUpstream("c")).sort(), ["a", "b", "c"]);
  assert.deepEqual(Array.from(g.getDownstream("b")).sort(), ["b", "c", "d"]);
  assert.equal(g.nodeMap.get("a").descendantCount, 3);
  assert.equal(g.nodeMap.get("d").ancestorCount, 3);
});

test("persistent 1-skeleton detects a cycle", () => {
  const g = graph(["a", "b", "c"], [["a", "b", .2], ["b", "c", .3], ["c", "a", .4]]);
  const result = Topology.analyze(g.nodes, g.edges, 1, false);
  assert.equal(result.beta0, 1);
  assert.equal(result.beta1, 1);
  assert.equal(result.beta2, 0);
});

test("area filling detects and fills an independent four-edge loop", () => {
  const g = graph(["a", "b", "c", "d"], [["a", "b", .2], ["b", "c", .3], ["c", "d", .4], ["d", "a", .5]]);
  const result = Topology.analyze(g.nodes, g.edges, 1, true);
  assert.equal(result.faces.length, 1);
  assert.equal(result.beta1, 0);
  assert.equal(result.euler, 1);
});

test("semantic hierarchical cluster and radial layouts cover every node", () => {
  const g = graph(["a", "b", "c", "d"], [["a", "b"], ["b", "c"]]);
  [Model.semanticTargets(g.nodes, "category"), Model.hierarchicalTargets(g.nodes), Model.clusterTargets(g.nodes, "category"), Model.radialTargets(g, "b")].forEach(targets => assert.equal(targets.size, 4));
});
