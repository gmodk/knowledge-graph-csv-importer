const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

test("modular HTML references existing local assets", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const refs = Array.from(html.matchAll(/(?:src|href)="([^"]+)"/g), match => match[1]).filter(ref => !/^(?:https?:|#|data:)/.test(ref));
  assert.ok(refs.length >= 4);
  refs.forEach(ref => assert.ok(fs.existsSync(path.join(root, ref)), `missing ${ref}`));
});

test("standalone build has inline CSS and graph scripts", () => {
  const file = path.join(root, "universal-csv-graph-importer.html");
  assert.ok(fs.existsSync(file));
  const html = fs.readFileSync(file, "utf8");
  assert.match(html, /<style>[\s\S]+--accent/);
  assert.match(html, /CSVGraphCore/);
  assert.match(html, /universal constellation/i);
  assert.doesNotMatch(html, /src="src\//);
});
