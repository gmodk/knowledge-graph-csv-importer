import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.dirname(fileURLToPath(import.meta.url));
const nodes = fs.readFileSync(path.join(root,"examples/science_world_nodes.csv"),"utf8");
const edges = fs.readFileSync(path.join(root,"examples/science_world_edges.csv"),"utf8");
const js = `(function(root){root.CSVGraphSample={nodesCSV:${JSON.stringify(nodes)},edgesCSV:${JSON.stringify(edges)}};})(typeof globalThis!=="undefined"?globalThis:this);\n`;
fs.writeFileSync(path.join(root,"src/sample-data.js"),js);
console.log(`Built sample-data.js (${nodes.split(/\n/).length-2} nodes, ${edges.split(/\n/).length-2} edges)`);
