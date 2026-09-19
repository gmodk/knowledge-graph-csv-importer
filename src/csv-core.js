(function (root) {
  "use strict";

  const SYNONYMS = {
    id: ["id", "node id", "node_id", "key", "uid", "identifier"],
    label: ["label", "name", "title", "node", "concept"],
    category: ["category", "group", "class", "cluster", "kind", "node type", "node_type", "type"],
    source: ["source", "from", "src", "origin", "parent", "start"],
    target: ["target", "to", "dst", "destination", "child", "end"],
    relation: ["relation", "relationship", "relation type", "relation_type", "edge type", "edge_type", "predicate"],
    weight: ["weight", "strength", "score", "distance", "cost", "value"],
    directed: ["directed", "directional", "one way", "one_way"],
    color: ["color", "colour", "hex"],
    size: ["size", "radius", "magnitude", "importance"],
    url: ["url", "link", "href", "website"],
    description: ["description", "detail", "details", "summary", "notes"],
    adjacency: ["connections", "connection", "neighbors", "neighbours", "links", "adjacent", "targets", "relations"]
  };

  function norm(value) {
    return String(value == null ? "" : value).trim().toLowerCase().replace(/[\s_-]+/g, " ");
  }

  function detectDelimiter(text) {
    const lines = String(text || "").replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean).slice(0, 8);
    const candidates = [",", ";", "\t", "|"];
    let best = ",", bestScore = -Infinity;
    for (const delimiter of candidates) {
      const counts = lines.map(line => countOutsideQuotes(line, delimiter));
      const positive = counts.filter(n => n > 0);
      if (!positive.length) continue;
      const average = positive.reduce((a, b) => a + b, 0) / positive.length;
      const variance = positive.reduce((sum, n) => sum + Math.abs(n - average), 0) / positive.length;
      const score = positive.length * 10 + average - variance * 2;
      if (score > bestScore) { bestScore = score; best = delimiter; }
    }
    return best;
  }

  function countOutsideQuotes(line, delimiter) {
    let quoted = false, count = 0;
    for (let i = 0; i < line.length; i += 1) {
      if (line[i] === '"') {
        if (quoted && line[i + 1] === '"') i += 1;
        else quoted = !quoted;
      } else if (!quoted && line[i] === delimiter) count += 1;
    }
    return count;
  }

  function parseCSV(text, forcedDelimiter) {
    text = String(text == null ? "" : text).replace(/^\uFEFF/, "");
    const delimiter = forcedDelimiter || detectDelimiter(text);
    const rows = [];
    let row = [], cell = "", quoted = false;
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
        else if (ch === '"') quoted = false;
        else cell += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === delimiter) { row.push(cell); cell = ""; }
      else if (ch === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
      else cell += ch;
    }
    if (cell.length || row.length) { row.push(cell.replace(/\r$/, "")); rows.push(row); }
    while (rows.length && rows[rows.length - 1].every(v => !String(v).trim())) rows.pop();
    if (!rows.length) return { delimiter, headers: [], rows: [], warnings: ["The file is empty."] };
    const rawHeaders = rows.shift().map((h, i) => String(h).trim() || `column_${i + 1}`);
    const seen = new Map();
    const headers = rawHeaders.map(h => {
      const count = seen.get(h) || 0; seen.set(h, count + 1);
      return count ? `${h}_${count + 1}` : h;
    });
    const records = rows.filter(r => r.some(v => String(v).trim())).map(values => {
      const record = {};
      headers.forEach((h, i) => { record[h] = values[i] == null ? "" : values[i].trim(); });
      return record;
    });
    const warnings = [];
    if (rows.some(r => r.length !== headers.length)) warnings.push("Some rows have a different number of cells than the header.");
    return { delimiter, headers, rows: records, warnings };
  }

  function bestColumn(headers, purpose, excluded) {
    const deny = new Set(excluded || []), targets = SYNONYMS[purpose] || [];
    let best = "", score = 0;
    for (const header of headers) {
      if (deny.has(header)) continue;
      const n = norm(header);
      let candidate = 0;
      targets.forEach((target, index) => {
        const t = norm(target);
        if (n === t) candidate = Math.max(candidate, 100 - index);
        else if (n.includes(t) || t.includes(n)) candidate = Math.max(candidate, 60 - index);
      });
      if (candidate > score) { score = candidate; best = header; }
    }
    return best;
  }

  function inferTable(name, parsed) {
    const h = parsed.headers;
    const source = bestColumn(h, "source"), target = bestColumn(h, "target", [source]);
    const adjacency = bestColumn(h, "adjacency"), id = bestColumn(h, "id") || h[0] || "";
    const fileHint = norm(name);
    let role = source && target ? "edges" : adjacency && id ? "adjacency" : "nodes";
    if (/edge|link|relation/.test(fileHint) && source && target) role = "edges";
    if (/node|vertex|entit/.test(fileHint) && role !== "adjacency") role = "nodes";
    const mapping = role === "edges" ? {
      source, target,
      relation: bestColumn(h, "relation", [source, target]),
      weight: bestColumn(h, "weight", [source, target]),
      directed: bestColumn(h, "directed", [source, target])
    } : {
      id,
      label: bestColumn(h, "label", [id]) || id,
      category: bestColumn(h, "category", [id]),
      color: bestColumn(h, "color", [id]),
      size: bestColumn(h, "size", [id]),
      url: bestColumn(h, "url", [id]),
      description: bestColumn(h, "description", [id]),
      adjacency: role === "adjacency" ? adjacency : ""
    };
    return { name, role, mapping, parsed };
  }

  function truthy(value) {
    return /^(1|true|yes|y|directed)$/i.test(String(value || "").trim());
  }

  function splitConnections(value) {
    return String(value || "").split(/[;,|]/).map(v => v.trim()).filter(Boolean);
  }

  function normalizeTables(tables) {
    const nodes = new Map(), edges = [], warnings = [];
    function addNode(id, label, properties, mapping) {
      id = String(id == null ? "" : id).trim();
      if (!id) return null;
      const previous = nodes.get(id);
      const node = previous || { id, label: String(label || id), category: "node", properties: {} };
      node.label = String(label || node.label || id);
      node.properties = Object.assign(node.properties, properties || {});
      if (mapping) {
        if (mapping.category && properties[mapping.category]) node.category = properties[mapping.category];
        if (mapping.color && properties[mapping.color]) node.color = properties[mapping.color];
        if (mapping.size && Number.isFinite(Number(properties[mapping.size]))) node.size = Number(properties[mapping.size]);
        if (mapping.url && properties[mapping.url]) node.url = properties[mapping.url];
        if (mapping.description && properties[mapping.description]) node.description = properties[mapping.description];
      }
      nodes.set(id, node); return node;
    }
    for (const table of tables) {
      if (table.role === "ignore" || !table.mapping) continue;
      const m = table.mapping;
      if (table.role === "nodes" || table.role === "adjacency") {
        for (const row of table.parsed.rows) addNode(row[m.id], row[m.label] || row[m.id], row, m);
      }
    }
    for (const table of tables) {
      if (table.role === "ignore" || !table.mapping) continue;
      const m = table.mapping;
      if (table.role === "edges") {
        for (const row of table.parsed.rows) {
          const source = String(row[m.source] || "").trim(), target = String(row[m.target] || "").trim();
          if (!source || !target) { warnings.push(`Skipped an edge in ${table.name}: source or target is empty.`); continue; }
          addNode(source, source, {}, null); addNode(target, target, {}, null);
          edges.push({ source, target, type: String(row[m.relation] || "relation"), weight: finite(row[m.weight], 1), directed: truthy(row[m.directed]), properties: row });
        }
      } else if (table.role === "adjacency" && m.adjacency) {
        for (const row of table.parsed.rows) {
          const source = String(row[m.id] || "").trim();
          splitConnections(row[m.adjacency]).forEach(target => {
            addNode(target, target, {}, null);
            edges.push({ source, target, type: "connection", weight: 1, directed: false, properties: row });
          });
        }
      }
    }
    const unique = new Map();
    edges.forEach((edge, i) => {
      const pair = edge.directed ? `${edge.source}>${edge.target}` : [edge.source, edge.target].sort().join("~");
      const key = `${pair}|${edge.type}`;
      if (!unique.has(key) && edge.source !== edge.target) unique.set(key, Object.assign({ id: `e${i + 1}` }, edge));
    });
    const result = { nodes: Array.from(nodes.values()), edges: Array.from(unique.values()), warnings };
    if (!result.nodes.length) result.warnings.push("No nodes were created. Check the table roles and ID mappings.");
    return result;
  }

  function finite(value, fallback) {
    const n = Number(value); return Number.isFinite(n) ? n : fallback;
  }

  function displayValue(value) {
    const text = String(value == null ? "" : value).trim();
    return text || "unassigned";
  }

  function categoricalValues(graph, property, declared) {
    const values = new Set((declared || []).map(displayValue));
    graph.nodes.forEach(node => values.add(displayValue(property === "category" ? node.category : node.properties && node.properties[property])));
    return Array.from(values).sort();
  }

  function inferDisplaySchema(graph) {
    const columns = new Set();
    graph.nodes.forEach(n => Object.keys(n.properties || {}).forEach(k => columns.add(k)));
    const categorical = [], numeric = [];
    for (const column of columns) {
      const values = graph.nodes.map(n => n.properties && n.properties[column]).filter(v => String(v == null ? "" : v).trim());
      if (!values.length) continue;
      const numbers = values.map(Number).filter(Number.isFinite);
      if (numbers.length / values.length >= 0.8) {
        numeric.push({ key: column, min: Math.min(...numbers), max: Math.max(...numbers) });
      } else {
        const unique = Array.from(new Set(values.map(String)));
        // Keep broad ontologies such as the science atlas's 37 domains available
        // as display/filter dimensions without admitting near-unique ID-like fields.
        const limit = Math.min(64, Math.max(4, Math.round(Math.sqrt(graph.nodes.length) * 2)));
        if (unique.length >= 2 && unique.length <= limit && unique.length <= graph.nodes.length * 0.7) categorical.push({ key: column, values: unique.sort() });
      }
    }
    if (!categorical.some(c => c.key === "category")) {
      const categories = Array.from(new Set(graph.nodes.map(n => n.category).filter(Boolean))).sort();
      if (categories.length) categorical.unshift({ key: "category", values: categories, virtual: true });
    }
    return {
      categorical,
      numeric,
      edgeTypes: Array.from(new Set(graph.edges.map(e => e.type || "relation"))).sort()
    };
  }

  const api = { SYNONYMS, norm, detectDelimiter, parseCSV, bestColumn, inferTable, normalizeTables, inferDisplaySchema, splitConnections, displayValue, categoricalValues };
  root.CSVGraphCore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
