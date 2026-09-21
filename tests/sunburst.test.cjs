const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ConstellationSunburst = require("../src/sunburst-view.js");

const project = (nodes, edges, options) => ConstellationSunburst.projectHierarchy({ nodes, edges }, options);
const nodes = (...ids) => ids.map(id => ({ id, label: id.toUpperCase(), type: "node", properties: {} }));
const edge = (source, target, type = "contains", id = `${source}-${target}-${type}`) => ({ id, source, target, type, directed: true });

test("projects a simple tree without mutating the canonical graph", () => {
  const graph = { nodes: nodes("root", "branch", "leaf"), edges: [edge("root", "branch"), edge("branch", "leaf")] };
  const before = JSON.stringify(graph);
  const result = ConstellationSunburst.projectHierarchy(graph);
  assert.equal(result.root.id, "root");
  assert.equal(result.root.children[0].id, "branch");
  assert.equal(result.root.children[0].children[0].id, "leaf");
  assert.equal(result.root.subtreeSize, 3);
  assert.equal(JSON.stringify(graph), before);
});

test("uses a display-only Workspace root for multiple roots", () => {
  const result = project(nodes("a", "b"), []);
  assert.equal(result.root.id, "__workspace__");
  assert.deepEqual(result.root.children.map(node => node.id), ["a", "b"]);
  assert.ok(result.diagnostics.some(item => item.code === "SUNBURST_SYNTHETIC_ROOT"));
});

test("resolves multiple parents by relation priority and stable tie breakers", () => {
  const result = project(nodes("a", "z", "child"), [edge("a", "child", "hierarchy", "2"), edge("z", "child", "contains", "1")]);
  assert.equal(result.selectedParentByNodeId.get("child").parentId, "z");
  const diagnostic = result.diagnostics.find(item => item.code === "SUNBURST_MULTIPLE_PARENTS");
  assert.equal(diagnostic.chosenParentId, "z");
  assert.equal(diagnostic.candidateCount, 2);
});

test("rejects a cycle-forming display parent", () => {
  const result = project(nodes("a", "b"), [edge("a", "b"), edge("b", "a")]);
  assert.ok(result.diagnostics.some(item => item.code === "SUNBURST_CYCLE_EDGE_IGNORED"));
  assert.doesNotThrow(() => JSON.stringify(result.root, (key, value) => key === "parent" ? undefined : value));
});

test("keeps cross-links out of the hierarchy projection", () => {
  const result = project(nodes("root", "child", "peer"), [edge("root", "child"), edge("child", "peer", "links-to")]);
  assert.equal(result.byId.get("peer").parent.id, "__workspace__");
  assert.equal(result.selectedParentByNodeId.has("peer"), false);
});

test("keeps duplicate titles separate by canonical ID", () => {
  const duplicateTitles = [{ id: "one", label: "Same" }, { id: "two", label: "Same" }];
  const result = project(duplicateTitles, []);
  assert.equal(result.byId.get("one").label, "Same");
  assert.equal(result.byId.get("two").label, "Same");
  assert.equal(result.byId.size, 3);
});

test("uses Notion containment before database membership", () => {
  const notionNodes = nodes("workspace", "database", "page").map(node => ({ ...node, sourceFormat: "notion", notionId: node.id }));
  const result = project(notionNodes, [edge("database", "page", "database-membership"), edge("workspace", "page", "contains")]);
  assert.equal(result.selectedParentByNodeId.get("page").parentId, "workspace");
  assert.equal(result.byId.get("page").sourceNode.notionId, "page");
});

test("supports ordinary CSV hierarchy relation types", () => {
  const csvNodes = nodes("course", "lesson").map(node => ({ ...node, sourceFormat: "csv" }));
  const result = project(csvNodes, [edge("course", "lesson", "parent-child")]);
  assert.equal(result.root.id, "course");
  assert.equal(result.root.children[0].id, "lesson");
});

test("handles a graph with no hierarchy", () => {
  const result = project(nodes("a", "b", "c"), [edge("a", "b", "references"), edge("b", "c", "related-to")]);
  assert.equal(result.root.label, "Workspace");
  assert.equal(result.root.children.length, 3);
  assert.equal(result.diagnostics.filter(item => item.code === "SUNBURST_SYNTHETIC_ROOT").length, 1);
});

test("emits coded diagnostics for malformed hierarchy inputs", () => {
  const malformedNodes = [{ id: "", label: "Missing" }, { id: "a", label: "First" }, { id: "a", label: "Duplicate" }, { id: "b", label: "Second" }];
  const result = project(malformedNodes, [edge("a", "a"), edge("a", "missing")]);
  const codes = new Set(result.diagnostics.map(item => item.code));
  assert.ok(codes.has("SUNBURST_NODE_MISSING_ID"));
  assert.ok(codes.has("SUNBURST_DUPLICATE_NODE_ID"));
  assert.ok(codes.has("SUNBURST_HIERARCHY_EDGE_MISSING_NODE"));
  assert.ok(codes.has("SUNBURST_SELF_PARENT"));
});

test("integrates Sunburst without replacing 2D, 3D, TDA, imports, or snapshot persistence", () => {
  const root = path.resolve(__dirname, "..");
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const app = fs.readFileSync(path.join(root, "src/app.js"), "utf8");
  const sunburst = fs.readFileSync(path.join(root, "src/sunburst-view.js"), "utf8");
  ["2d", "3d", "sunburst", "tda"].forEach(mode => assert.match(html, new RegExp(`<option value="${mode}"`)));
  assert.match(html, /src\/sunburst-view\.js/);
  assert.match(html, /id="sunburstView"/);
  assert.match(app, /sunburstView\.setGraph\(graph\)/);
  assert.match(app, /Topology\.analyze\(nodes, edges/);
  assert.match(app, /CSVImportAdapter\.parse/);
  assert.match(app, /NotionImportAdapter\.parse/);
  assert.match(app, /saveBrowserSnapshot/);
  assert.match(app, /SUNBURST_STATE_KEY/);
  assert.match(sunburst, /node\.id !== configuredRoot/);
  assert.match(sunburst, /center-circle is-selected/);
  assert.doesNotMatch(sunburst, /parseCSV|NotionImportAdapter|CSVImportAdapter/);
});
