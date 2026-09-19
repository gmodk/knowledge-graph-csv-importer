const test = require("node:test");
const assert = require("node:assert/strict");
const JSZip = require("../vendor/jszip.min.js");
const Importer = require("../src/notion-import.js");

const A = "0123456789abcdef0123456789abcdef";
const B = "fedcba9876543210fedcba9876543210";

async function parse(files) {
  const zip = new JSZip();
  Object.entries(files).forEach(([name, content]) => zip.file(name, content));
  const bytes = await zip.generateAsync({ type: "uint8array" });
  return Importer.parse(bytes, JSZip);
}

test("normalizes dashed and compact Notion IDs", () => {
  assert.equal(Importer.normalizeNotionId(A), A);
  assert.equal(Importer.normalizeNotionId("01234567-89ab-cdef-0123-456789abcdef"), A);
});

test("imports one Markdown page deterministically", async () => {
  const files = { [`Alpha ${A}.md`]: "# Alpha\n" };
  const first = await parse(files), second = await parse(files);
  assert.equal(first.nodes.length, 1); assert.equal(first.edges.length, 0);
  assert.equal(first.nodes[0].id, `notion:${A}`);
  assert.deepEqual(first.nodes.map(n => n.id), second.nodes.map(n => n.id));
  assert.deepEqual(first.edges.map(e => e.id), second.edges.map(e => e.id));
});

test("resolves hierarchy, links, Unicode paths, assets, and broken links", async () => {
  const parent = `Parent ${A}`, child = `Niño ${B}`;
  const result = await parse({
    [`${parent}.md`]: `# Parent\n[Child](${encodeURIComponent(parent)}/${encodeURIComponent(child)}.md)\n[Missing](Missing.md)\n![Image](media/photo.png)`,
    [`${parent}/${child}.md`]: "# Niño\n",
    "media/photo.png": new Uint8Array([1, 2, 3])
  });
  assert.equal(result.nodes.length, 2);
  assert.ok(result.edges.some(e => e.type === "contains" && e.target === `notion:${B}`));
  assert.ok(result.edges.some(e => e.type === "links-to" && e.target === `notion:${B}`));
  assert.ok(result.nodes.find(n => n.id === `notion:${A}`).properties.assets.includes("media/photo.png"));
  assert.ok(result.diagnostics.some(d => d.code === "NOTION_UNRESOLVED_LINK"));
  assert.equal(result.nodes.some(n => /Missing/.test(n.label)), false);
});

test("keeps equal titles with distinct IDs", async () => {
  const result = await parse({ [`Same ${A}.md`]: "# Same", [`Same ${B}.md`]: "# Same" });
  assert.equal(result.nodes.length, 2);
  assert.equal(new Set(result.nodes.map(n => n.id)).size, 2);
});

test("imports databases, entries, properties, and membership", async () => {
  const result = await parse({ [`Tasks ${A}.csv`]: "Name,Status\nFirst,Done\nSecond,Open" });
  assert.equal(result.metadata.databaseFiles, 1);
  assert.equal(result.nodes.filter(n => n.type === "notion-database-entry").length, 2);
  assert.equal(result.edges.filter(e => e.type === "contains").length, 2);
  assert.equal(result.nodes.find(n => n.label === "First").properties.Status, "Done");
});

test("merges a Notion database Markdown page with its _all CSV without a duplicate warning", async () => {
  const result = await parse({
    [`fauna (ideas exploration) ${A}.md`]: `# fauna (ideas exploration)\n[database](fauna%20(ideas%20exploration)%20${A}_all.csv)`,
    [`fauna (ideas exploration) ${A}_all.csv`]: "Name,Status\nOtter,New"
  });
  assert.equal(result.nodes.filter(n => n.id === `notion:${A}`).length, 1);
  assert.equal(result.nodes.find(n => n.id === `notion:${A}`).type, "notion-database");
  assert.equal(result.diagnostics.some(d => d.code === "NOTION_DUPLICATE_ID"), false);
  assert.ok(result.edges.some(e => e.type === "links-to" && e.target === `notion:${A}`) === false, "self-links are omitted");
});

test("parses Notion links containing literal balanced parentheses", async () => {
  const result = await parse({
    [`Home ${A}.md`]: `# Home\n[Grounds](grounds%20(_data)%20${B}.md)`,
    [`grounds (_data) ${B}.md`]: "# Grounds"
  });
  assert.ok(result.edges.some(e => e.type === "links-to" && e.source === `notion:${A}` && e.target === `notion:${B}`));
  assert.equal(result.diagnostics.some(d => /grounds%20\(_data/.test(d.message)), false);
});

test("matches database rows to exported page files through ID-free folder aliases", async () => {
  const result = await parse({
    [`Tasks ${A}.md`]: "# Tasks",
    [`Tasks ${A}_all.csv`]: "Name,Status\nFirst,Done",
    [`Tasks/First ${B}.md`]: "# First"
  });
  assert.equal(result.nodes.filter(n => n.label === "First").length, 1);
  assert.ok(result.edges.some(e => e.type === "contains" && e.source === `notion:${A}` && e.target === `notion:${B}`));
});

test("keeps omitted Notion _all CSV links as supporting metadata without graph warnings", async () => {
  const first = "060cf483b9684860ac9272c2a691d70d", second = "ec9d459aeb22421197ee66f9c831a990";
  const result = await parse({
    [`Home ${A}.md`]: `# Home\n[One](Home/Untitled%20${first}_all.csv)\n[Two](Home/Untitled%20${second}_all.csv)`
  });
  const home = result.nodes[0];
  assert.equal(home.properties.missingSupportingFiles.length, 2);
  assert.equal(result.diagnostics.some(d => d.code === "NOTION_UNRESOLVED_LINK"), false);
  assert.equal(result.edges.length, 0);
});

test("resolves explicit database relations by Notion URL ID", async () => {
  const result = await parse({
    [`Target ${B}.md`]: "# Target",
    [`Tasks ${A}.csv`]: `Name,Relation\nFirst,https://www.notion.so/Target-${B}`
  });
  const relation = result.edges.find(e => e.type === "relation");
  assert.ok(relation);
  assert.equal(relation.target, `notion:${B}`);
  assert.equal(relation.provenance.mechanism, "database-relation");
});

test("reports malformed ZIPs without producing a graph", async () => {
  await assert.rejects(() => Importer.parse(new Uint8Array([1, 2, 3]), JSZip), /NOTION_ZIP_INVALID/);
});

test("rejects archive traversal entries and records a diagnostic", async () => {
  const zip = new JSZip(); zip.file("../escape.md", "# Escape");
  const bytes = await zip.generateAsync({ type: "uint8array" });
  const manifest = await Importer.scanZip(bytes, JSZip);
  assert.equal(manifest.markdownFiles.length, 0);
  assert.ok(manifest.diagnostics.some(d => d.code === "NOTION_PATH_INVALID"));
});
