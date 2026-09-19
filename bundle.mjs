import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
let html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = ["styles.css", "feature.css", "mobile.css"].map(file => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
const scripts = ["vendor/jszip.min.js", "src/sample-data.js", "src/csv-core.js", "src/import-adapters.js", "src/notion-import.js", "src/graph-core.js", "src/topology.js", "src/app.js"].map(file => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
html = html.replace('<link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="feature.css"><link rel="stylesheet" href="mobile.css">', `<style>\n${css}\n</style>`);
html = html.replace(/\s*<script src="vendor\/jszip\.min\.js"><\/script><script src="src\/sample-data\.js"><\/script><script src="src\/csv-core\.js"><\/script><script src="src\/import-adapters\.js"><\/script><script src="src\/notion-import\.js"><\/script><script src="src\/graph-core\.js"><\/script><script src="src\/topology\.js"><\/script><script src="src\/app\.js"><\/script>/, `\n<script>\n${scripts}\n</script>`);
const output = path.join(root, "universal-csv-graph-importer.html");
fs.writeFileSync(output, html);
console.log(`Built ${path.basename(output)} (${Buffer.byteLength(html).toLocaleString()} bytes)`);
