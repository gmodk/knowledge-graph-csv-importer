const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Core = require("../src/csv-core.js");

const root = path.resolve(__dirname, "..");
const nodesPath = path.join(root, "examples/science_world_nodes.csv");
const edgesPath = path.join(root, "examples/science_world_edges.csv");
const modulesPath = path.join(root, "examples/science_modules");

test("science sample is a valid two-table import", () => {
  const nodeTable = Core.inferTable("science_world_nodes.csv", Core.parseCSV(fs.readFileSync(nodesPath, "utf8")));
  const edgeTable = Core.inferTable("science_world_edges.csv", Core.parseCSV(fs.readFileSync(edgesPath, "utf8")));
  assert.equal(nodeTable.role, "nodes");
  assert.equal(edgeTable.role, "edges");
  const graph = Core.normalizeTables([nodeTable, edgeTable]);
  assert.equal(graph.nodes.length, 3815);
  assert.equal(graph.edges.length, 4669);
  assert.deepEqual(graph.warnings, []);
});

test("science sample covers the requested discipline hubs", () => {
  const parsed = Core.parseCSV(fs.readFileSync(nodesPath, "utf8"));
  const ids = new Set(parsed.rows.map(row => row.id));
  ["mathematics", "physics", "computer_science", "biology", "biochemistry", "neurobiology", "neuroscience", "chemistry", "earth_science", "astronomy", "medicine", "engineering"].forEach(id => assert.ok(ids.has(id), `missing ${id}`));
});

test("science sample exercises categorical numeric directed and weighted fields", () => {
  const nodeTable = Core.inferTable("science_world_nodes.csv", Core.parseCSV(fs.readFileSync(nodesPath, "utf8")));
  const edgeTable = Core.inferTable("science_world_edges.csv", Core.parseCSV(fs.readFileSync(edgesPath, "utf8")));
  const graph = Core.normalizeTables([nodeTable, edgeTable]);
  const schema = Core.inferDisplaySchema(graph);
  assert.ok(schema.categorical.some(field => field.key === "domain"));
  assert.ok(schema.categorical.some(field => field.key === "level"));
  assert.ok(schema.numeric.some(field => field.key === "importance"));
  assert.ok(schema.numeric.some(field => field.key === "complexity"));
  assert.ok(graph.edges.some(edge => edge.directed));
  assert.ok(graph.edges.some(edge => !edge.directed));
  assert.ok(graph.edges.every(edge => Number.isFinite(edge.weight)));
});

test("science sample includes cross-disciplinary bridges", () => {
  const parsed = Core.parseCSV(fs.readFileSync(edgesPath, "utf8"));
  const keys = new Set(parsed.rows.map(row => `${row.source}|${row.target}|${row.relation_detail || row.relation}`));
  [
    "differential_geometry|general_relativity|language_of",
    "graph_theory|network_science|supports",
    "predictive_coding|bayesian_inference|uses",
    "quantum_mechanics|quantum_computing|enables",
    "carbon_cycle|photosynthesis|couples",
    "machine_learning|genomics|analyzes"
  ].forEach(key => assert.ok(keys.has(key), `missing bridge ${key}`));
});

test("science atlas includes substantial frontier and landmark coverage", () => {
  const parsed = Core.parseCSV(fs.readFileSync(nodesPath, "utf8"));
  const categories = new Map();
  for (const row of parsed.rows) {
    categories.set(row.category, (categories.get(row.category) || 0) + 1);
  }
  assert.ok((categories.get("research frontier") || 0) >= 750);
  const landmarkCategories = ["theory", "theorem", "hypothesis", "conjecture", "law", "principle", "thesis", "model"];
  const landmarks = landmarkCategories.reduce((total, category) => total + (categories.get(category) || 0), 0);
  assert.ok(landmarks >= 780);
  assert.ok(categories.has("topic"));
  assert.ok(categories.has("method"));
});

test("science atlas preserves relation detail and provenance while limiting display families", () => {
  const parsed = Core.parseCSV(fs.readFileSync(edgesPath, "utf8"));
  const families = new Set(parsed.rows.map(row => row.relation));
  assert.ok(families.size <= 12, `too many display relation families: ${families.size}`);
  assert.ok(parsed.rows.every(row => row.relation_detail));
  assert.ok(parsed.rows.every(row => row.relation_family === row.relation));
  assert.ok(parsed.rows.every(row => row.provenance));
});

test("science atlas is partitioned into independently importable semantic modules", () => {
  const manifest = Core.parseCSV(fs.readFileSync(path.join(modulesPath, "module_manifest.csv"), "utf8")).rows;
  const semanticModules = manifest.filter(row => row.module_key !== "cross_domain_bridges");
  assert.equal(semanticModules.length, 27);
  assert.ok(semanticModules.some(row => row.module_key === "mathematical_sciences"));
  assert.ok(semanticModules.some(row => row.module_key === "fundamental_physics"));
  assert.ok(semanticModules.some(row => row.module_key === "computer_science"));
  for (const row of semanticModules) {
    const nodeFile = path.join(modulesPath, row.nodes_file), edgeFile = path.join(modulesPath, row.edges_file);
    assert.ok(fs.existsSync(nodeFile), `missing ${row.nodes_file}`);
    assert.ok(fs.existsSync(edgeFile), `missing ${row.edges_file}`);
    const nodeTable = Core.inferTable(row.nodes_file, Core.parseCSV(fs.readFileSync(nodeFile, "utf8")));
    const edgeTable = Core.inferTable(row.edges_file, Core.parseCSV(fs.readFileSync(edgeFile, "utf8")));
    const graph = Core.normalizeTables([nodeTable, edgeTable]);
    assert.equal(graph.nodes.length, Number(row.node_count));
    assert.equal(graph.edges.length, Number(row.internal_edge_count));
    assert.deepEqual(graph.warnings, [], `${row.module_key} should import without warnings`);
    assert.ok(fs.statSync(nodeFile).size < 250000, `${row.nodes_file} is unexpectedly large`);
    assert.ok(fs.statSync(edgeFile).size < 250000, `${row.edges_file} is unexpectedly large`);
  }
});

test("semantic modules and bridge file reconstruct the monolithic atlas exactly", () => {
  const manifest = Core.parseCSV(fs.readFileSync(path.join(modulesPath, "module_manifest.csv"), "utf8")).rows;
  const semanticModules = manifest.filter(row => row.module_key !== "cross_domain_bridges");
  const nodeIds = new Set(), edgeKeys = new Set();
  for (const row of semanticModules) {
    const moduleNodes = Core.parseCSV(fs.readFileSync(path.join(modulesPath, row.nodes_file), "utf8")).rows;
    const moduleEdges = Core.parseCSV(fs.readFileSync(path.join(modulesPath, row.edges_file), "utf8")).rows;
    for (const node of moduleNodes) { assert.ok(!nodeIds.has(node.id), `node assigned twice: ${node.id}`); nodeIds.add(node.id); }
    for (const edge of moduleEdges) edgeKeys.add(`${edge.source}|${edge.target}|${edge.relation}`);
  }
  const bridges = Core.parseCSV(fs.readFileSync(path.join(modulesPath, "cross_domain_edges.csv"), "utf8")).rows;
  for (const edge of bridges) edgeKeys.add(`${edge.source}|${edge.target}|${edge.relation}`);
  const fullNodes = Core.parseCSV(fs.readFileSync(nodesPath, "utf8")).rows;
  const fullEdges = Core.parseCSV(fs.readFileSync(edgesPath, "utf8")).rows;
  assert.equal(nodeIds.size, fullNodes.length);
  assert.equal(edgeKeys.size, fullEdges.length);
  const bridgeNodeIds = new Set(Core.parseCSV(fs.readFileSync(path.join(modulesPath, "cross_domain_nodes.csv"), "utf8")).rows.map(row => row.id));
  assert.ok(bridges.every(edge => bridgeNodeIds.has(edge.source) && bridgeNodeIds.has(edge.target)));
});
