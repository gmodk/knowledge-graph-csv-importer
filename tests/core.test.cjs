const test = require("node:test");
const assert = require("node:assert/strict");
const Core = require("../src/csv-core.js");
const Model = require("../src/graph-core.js");

test("parses quoted CSV and detects delimiter", () => {
  const parsed = Core.parseCSV('id,name,links\n1,"Alpha, one","2;3"\n2,Beta,');
  assert.equal(parsed.delimiter, ",");
  assert.equal(parsed.rows[0].name, "Alpha, one");
  assert.equal(parsed.rows[0].links, "2;3");
});

test("preserves quoted multiline values", () => {
  const parsed = Core.parseCSV('id,notes\n1,"line one\nline two"\n2,done');
  assert.equal(parsed.rows.length, 2);
  assert.equal(parsed.rows[0].notes, "line one\nline two");
});

test("parses semicolon and tab dialects", () => {
  assert.equal(Core.parseCSV("id;name\n1;Alpha").delimiter, ";");
  assert.equal(Core.parseCSV("id\tname\n1\tAlpha").delimiter, "\t");
});

test("infers node and edge tables", () => {
  const nodes = Core.inferTable("vertices.csv", Core.parseCSV("node_id,title,group\na,Alpha,Core"));
  const edges = Core.inferTable("links.csv", Core.parseCSV("from,to,relationship,strength\na,b,knows,.8"));
  assert.equal(nodes.role, "nodes"); assert.equal(nodes.mapping.id, "node_id"); assert.equal(nodes.mapping.label, "title");
  assert.equal(edges.role, "edges"); assert.equal(edges.mapping.source, "from"); assert.equal(edges.mapping.target, "to");
});

test("normalizes edge-only files and creates endpoint nodes", () => {
  const edgeTable = Core.inferTable("edges.csv", Core.parseCSV("source,target,type\na,b,link\nb,c,link"));
  const graph = Core.normalizeTables([edgeTable]);
  assert.deepEqual(graph.nodes.map(n => n.id).sort(), ["a", "b", "c"]);
  assert.equal(graph.edges.length, 2);
});

test("normalizes adjacency lists", () => {
  const table = Core.inferTable("network.csv", Core.parseCSV('id,label,connections\na,Alpha,"b; c"\nb,Beta,c\nc,Gamma,'));
  assert.equal(table.role, "adjacency");
  const graph = Core.normalizeTables([table]);
  assert.equal(graph.nodes.length, 3); assert.equal(graph.edges.length, 3);
});

test("infers categorical and numeric display parameters", () => {
  const table = Core.inferTable("nodes.csv", Core.parseCSV("id,label,group,score\na,A,x,1\nb,B,x,2\nc,C,y,3\nd,D,y,4"));
  const graph = Core.normalizeTables([table]), schema = Core.inferDisplaySchema(graph);
  assert.ok(schema.categorical.some(x => x.key === "group"));
  assert.ok(schema.numeric.some(x => x.key === "score"));
});

test("categorical filters include sparse and empty values as unassigned", () => {
  const graph = { nodes: [
    { category: "page", properties: { externalLinks: ["https://example.com"] } },
    { category: "page", properties: { externalLinks: [] } },
    { category: "database", properties: {} }
  ] };
  assert.deepEqual(Core.categoricalValues(graph, "externalLinks", ["https://example.com"]), ["https://example.com", "unassigned"]);
  assert.deepEqual(Core.categoricalValues(graph, "category", ["page", "database"]), ["database", "page"]);
  assert.equal(Core.displayValue([]), "unassigned");
});

test("computes components and cycle rank", () => {
  const graph = Model.enrich({ nodes: ["a", "b", "c", "d"].map(id => ({ id, label: id, category: "n", properties: {} })), edges: [
    { source: "a", target: "b", type: "x", weight: 1 }, { source: "b", target: "c", type: "x", weight: 1 }, { source: "c", target: "a", type: "x", weight: 1 }
  ] });
  const topology = Model.components(graph);
  assert.equal(topology.beta0, 2); assert.equal(topology.beta1, 1);
});
