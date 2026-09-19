(function (root) {
  "use strict";
  const Core = root.CSVGraphCore || (typeof require === "function" ? require("./csv-core.js") : null);
  const LIMIT_FILES = 10000, LIMIT_BYTES = 200 * 1024 * 1024, LIMIT_TEXT = 8 * 1024 * 1024;
  const idPattern = /(?:^|[^0-9a-f])([0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?![0-9a-f])/gi;
  const assetPattern = /\.(?:png|jpe?g|gif|svg|webp|html?|pdf|mp[34]|mov|wav|zip|docx?|xlsx?|pptx?)$/i;
  function normalizeNotionId(value) {
    const decoded = decode(value), matches = Array.from(decoded.matchAll(idPattern));
    return matches.length ? matches[matches.length - 1][1].replace(/-/g, "").toLowerCase() : null;
  }
  function decode(value) { try { return decodeURIComponent(String(value)); } catch (_) { return String(value).replace(/%20/gi, " "); } }
  function pathOf(value) {
    const source = decode(value).replace(/\\/g, "/");
    if (/^(?:\/|[a-z]:\/)/i.test(source)) return null;
    const parts = [];
    for (const part of source.split("/")) {
      if (!part || part === ".") continue;
      if (part === "..") { if (!parts.length) return null; parts.pop(); } else parts.push(part);
    }
    return parts.join("/");
  }
  function join(base, relative) { return pathOf(base ? `${base}/${relative}` : relative); }
  function dirname(path) { return path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : ""; }
  function basename(path) { return path.split("/").pop(); }
  function stem(path) { return basename(path).replace(/\.[^.]+$/, ""); }
  function title(path) { return stem(path).replace(/_all$/i, "").replace(/\s+[0-9a-f]{32}$/i, "").replace(/\s+[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i, "").trim(); }
  function key(path) { return path.normalize("NFC").toLowerCase(); }
  function diagnostic(code, message, path) { return { code, severity: "warning", message, path: path || "" }; }
  function stats(items, field) { const out = {}; for (const item of items) out[item[field]] = (out[item[field]] || 0) + 1; return out; }
  async function scanZip(file, Zip, progress) {
    if (!Zip) throw new Error("NOTION_ZIP_UNSUPPORTED: ZIP reader is unavailable.");
    progress?.("Reading archive...");
    let zip; try { zip = await Zip.loadAsync(file); } catch (error) { throw new Error(`NOTION_ZIP_INVALID: ${error.message}`); }
    progress?.("Scanning files...");
    const entries = Object.values(zip.files).filter(entry => !entry.dir);
    if (entries.length > LIMIT_FILES) throw new Error("NOTION_ARCHIVE_TOO_LARGE: too many files.");
    const files = [], diagnostics = [], seen = new Set(); let total = 0;
    for (const entry of entries) {
      const original = entry.unsafeOriginalName || entry.name, path = pathOf(original);
      if (!path || pathOf(entry.name) !== path) { diagnostics.push(diagnostic("NOTION_PATH_INVALID", "Unsafe archive path skipped.", original)); continue; }
      if (/(^|\/)(__MACOSX|\.DS_Store|Thumbs\.db)(\/|$)/i.test(path)) continue;
      if (seen.has(key(path))) { diagnostics.push(diagnostic("NOTION_PATH_COLLISION", "Duplicate archive path skipped.", path)); continue; }
      seen.add(key(path));
      const size = entry._data?.uncompressedSize;
      if (Number.isFinite(size)) { total += size; if (total > LIMIT_BYTES) throw new Error("NOTION_ARCHIVE_TOO_LARGE: expanded archive exceeds 200 MiB."); }
      const extension = (path.match(/\.([^.\/]+)$/) || [])[1]?.toLowerCase() || "";
      const kind = extension === "md" ? "markdown" : extension === "csv" ? "database" : assetPattern.test(path) ? "asset" : "ignored";
      if ((kind === "markdown" || kind === "database") && size > LIMIT_TEXT) { diagnostics.push(diagnostic("NOTION_TEXT_TOO_LARGE", "Text file exceeds 8 MiB and was skipped.", path)); continue; }
      files.push({ path, filename: basename(path), extension, size: size || 0, kind, entry });
    }
    files.sort((a, b) => a.path.localeCompare(b.path));
    return { files, markdownFiles: files.filter(f => f.kind === "markdown"), csvFiles: files.filter(f => f.kind === "database"), assets: files.filter(f => f.kind === "asset"), ignoredFiles: files.filter(f => f.kind === "ignored"), diagnostics };
  }
  async function readText(file) {
    const bytes = await file.entry.async("uint8array");
    if (bytes.length > LIMIT_TEXT) throw new Error("Text file exceeds 8 MiB.");
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^\uFEFF/, "");
  }
  function links(text) {
    const found = [], source = String(text || "");
    for (let start = 0; start < source.length;) {
      const open = source.indexOf("](", start); if (open < 0) break;
      const labelOpen = source.lastIndexOf("[", open), asset = labelOpen > 0 && source[labelOpen - 1] === "!";
      let i = open + 2, href = "", depth = 0, angled = source[i] === "<";
      if (angled) {
        const close = source.indexOf(">", ++i); if (close < 0) { start = open + 2; continue; }
        href = source.slice(i, close); i = close + 1;
        while (/\s/.test(source[i] || "")) i++;
        if (source[i] !== ")") { start = open + 2; continue; }
      } else {
        for (; i < source.length; i++) {
          const ch = source[i];
          if (ch === "(") { depth++; href += ch; }
          else if (ch === ")" && depth) { depth--; href += ch; }
          else if (ch === ")") break;
          else href += ch;
        }
        if (i >= source.length) { start = open + 2; continue; }
      }
      href = href.trim().replace(/\s+"[^"]*"$/, "");
      if (href) found.push({ href, asset });
      start = i + 1;
    }
    return found;
  }
  function resolveReference(sourcePath, href, indexes) {
    const raw = String(href || "").trim();
    if (/^https?:/i.test(raw)) {
      const notionId = normalizeNotionId(raw), target = notionId && indexes.byNotionId.get(notionId);
      return target ? { status: "resolved", targetId: target.id, raw } : { status: "external", raw };
    }
    if (/^(?:mailto:|tel:|data:)/i.test(raw)) return { status: "external", raw };
    if (raw.startsWith("#")) return { status: "anchor", raw };
    const unfragmented = raw.split(/[?#]/)[0];
    const path = join(dirname(sourcePath), unfragmented);
    if (!path) return { status: "unresolved", raw };
    if (assetPattern.test(path)) return { status: "asset", path, raw };
    const byPath = indexes.byPath.get(key(path));
    if (byPath) return { status: "resolved", targetId: byPath.id, path, raw };
    const notionId = normalizeNotionId(unfragmented), byId = notionId && indexes.byNotionId.get(notionId);
    if (byId) return { status: "resolved", targetId: byId.id, path, raw };
    if (indexes.archivePaths?.has(key(path))) return { status: "asset", path, raw };
    if (/_all\.csv$/i.test(path)) return { status: "missing-support", path, raw };
    return { status: "unresolved", path, raw };
  }
  async function parseManifest(manifest, progress) {
    const diagnostics = [...manifest.diagnostics], nodes = new Map(), byPath = new Map(), byNotionId = new Map(), pageTexts = new Map(), databases = [], archivePaths = new Set(manifest.files.map(file => key(file.path)));
    const add = (node, path, notionId) => {
      if (nodes.has(node.id)) {
        const prior = nodes.get(node.id);
        const databasePagePair = notionId && prior.notionId === notionId && new Set([prior.notionKind, node.notionKind]).has("page") && new Set([prior.notionKind, node.notionKind]).has("database");
        if (databasePagePair) {
          if (node.notionKind === "database") {
            prior.type = prior.category = "notion-database";
            prior.notionKind = "database"; prior.properties.notionKind = "database"; prior.properties.databasePath = path;
          }
          byPath.set(key(path), prior); return prior;
        }
        diagnostics.push(diagnostic("NOTION_DUPLICATE_ID", `ID also appears at ${prior.properties.notionPath}.`, path));
        if (!prior.properties.alternatePaths) prior.properties.alternatePaths = [];
        prior.properties.alternatePaths.push(path);
        byPath.set(key(path), prior);
        return prior;
      }
      nodes.set(node.id, node); byPath.set(key(path), node); if (notionId) byNotionId.set(notionId, node); return node;
    };
    progress?.("Parsing pages...");
    for (const [i, file] of manifest.markdownFiles.entries()) {
      try {
        const text = await readText(file), notionId = normalizeNotionId(file.filename), path = file.path;
        const heading = text.match(/^#\s+(.+)$/m)?.[1]?.trim();
        const node = { id: notionId ? `notion:${notionId}` : `notion-path:${path}`, label: heading || title(path), type: "notion-page", category: "notion-page", sourceFormat: "notion", notionId, notionPath: path, notionKind: "page", properties: { sourceFormat: "notion", notionId, notionPath: path, notionKind: "page", externalLinks: [], assets: [], missingSupportingFiles: [] } };
        const stored = add(node, path, notionId), alias = join(dirname(path), `${title(path)}.md`);
        if (alias && !byPath.has(key(alias))) byPath.set(key(alias), stored);
        pageTexts.set(path, text);
      } catch (error) { diagnostics.push(diagnostic("NOTION_MALFORMED_TEXT", error.message, file.path)); }
      if (i % 50 === 49) await new Promise(resolve => setTimeout(resolve, 0));
    }
    progress?.("Parsing databases...");
    for (const [i, file] of manifest.csvFiles.entries()) {
      try {
        const text = await readText(file), parsed = Core.parseCSV(text), notionId = normalizeNotionId(file.filename), path = file.path;
        if (!parsed.headers.length) { diagnostics.push(diagnostic("NOTION_MALFORMED_CSV", "Empty database CSV.", path)); continue; }
        parsed.warnings.forEach(message => diagnostics.push(diagnostic("NOTION_MALFORMED_CSV", message, path)));
        const db = add({ id: notionId ? `notion:${notionId}` : `notion-path:${path}`, label: title(path), type: "notion-database", category: "notion-database", sourceFormat: "notion", notionId, notionPath: path, notionKind: "database", properties: { sourceFormat: "notion", notionId, notionPath: path, notionKind: "database" } }, path, notionId);
        const dbAlias = join(dirname(path), `${title(path)}.csv`); if (dbAlias && !byPath.has(key(dbAlias))) byPath.set(key(dbAlias), db);
        const rows = [];
        parsed.rows.forEach((row, index) => {
          const nameColumn = parsed.headers.find(h => /^(name|title)$/i.test(h)) || parsed.headers[0];
          const label = String(row[nameColumn] || `Entry ${index + 1}`).trim(), rowId = normalizeNotionId(row.id || row.ID || row[nameColumn]);
          const expectedPath = join(dirname(path), `${title(path)}/${title(label + ".md")}.md`);
          const matching = rowId && byNotionId.get(rowId) || byPath.get(key(expectedPath));
          const entry = matching || add({ id: rowId ? `notion:${rowId}` : `notion-row:${path}#${index + 1}`, label: title(label + ".md"), type: "notion-database-entry", category: "notion-database-entry", sourceFormat: "notion", notionId: rowId, notionPath: `${path}#${index + 1}`, notionKind: "database-entry", properties: { sourceFormat: "notion", notionId: rowId, notionPath: `${path}#${index + 1}`, notionKind: "database-entry" } }, `${path}#${index + 1}`, rowId);
          Object.assign(entry.properties, row);
          rows.push({ node: entry, row, index });
        });
        databases.push({ file, db, rows });
      } catch (error) { diagnostics.push(diagnostic("NOTION_MALFORMED_CSV", error.message, file.path)); }
      if (i % 20 === 19) await new Promise(resolve => setTimeout(resolve, 0));
    }
    return { nodes, indexes: { byPath, byNotionId, archivePaths }, pageTexts, databases, diagnostics };
  }
  function resolveGraph(discovery, manifest, progress) {
    progress?.("Resolving relationships...");
    const { nodes, indexes, pageTexts, databases, diagnostics } = discovery, edges = [], ordinals = new Map(); let resolved = 0, unresolved = 0;
    const addEdge = (source, target, type, mechanism, sourceFile, rawReference) => {
      if (!source || !target || source === target) return;
      const basis = `${source}|${type}|${target}|${mechanism}|${sourceFile}|${rawReference || ""}`, ordinal = (ordinals.get(basis) || 0) + 1;
      ordinals.set(basis, ordinal);
      edges.push({ id: `notion-edge:${encodeURIComponent(basis)}:${ordinal}`, source, target, type, directed: true, weight: 1, sourceFormat: "notion", provenance: { mechanism, sourceFile, rawReference: rawReference || "" }, properties: { sourceFormat: "notion", mechanism, sourceFile, rawReference: rawReference || "" } });
    };
    for (const [path, text] of pageTexts) {
      const node = indexes.byPath.get(key(path));
      for (const link of links(text)) {
        const result = resolveReference(path, link.href, indexes);
        if (result.status === "resolved") { addEdge(node.id, result.targetId, "links-to", "markdown-link", path, link.href); resolved++; }
        else if (result.status === "asset") node.properties.assets.push(result.path);
        else if (result.status === "missing-support") node.properties.missingSupportingFiles.push(result.path);
        else if (result.status === "external") node.properties.externalLinks.push(link.href);
        else if (result.status === "unresolved") { unresolved++; diagnostics.push(diagnostic("NOTION_UNRESOLVED_LINK", `Could not resolve ${link.href}.`, path)); }
      }
      const folder = dirname(path), folderParent = indexes.byPath.get(key(`${folder}.md`));
      if (folderParent && folderParent.id !== node.id) addEdge(folderParent.id, node.id, "contains", "parent-child", path, folder);
    }
    for (const { file, db, rows } of databases) {
      for (const { node, row } of rows) {
        addEdge(db.id, node.id, "contains", "database-membership", file.path, node.label);
        for (const [column, value] of Object.entries(row)) {
          if (!value || /^(id|name|title)$/i.test(column)) continue;
          const references = links(value);
          if (!references.length && /relation/i.test(column)) {
            for (const match of String(value).matchAll(idPattern)) references.push({ href: match[1] });
          }
          for (const ref of references) {
            const result = resolveReference(file.path, ref.href, indexes);
            if (result.status === "resolved") addEdge(node.id, result.targetId, "relation", "database-relation", file.path, `${column}: ${ref.href}`);
            else if (result.status === "unresolved") { unresolved++; diagnostics.push(diagnostic("NOTION_MISSING_TARGET", `Could not resolve ${ref.href}.`, file.path)); }
          }
        }
      }
      const parent = indexes.byPath.get(key(`${dirname(file.path) ? dirname(file.path) + "/" : ""}${title(file.path)}.md`));
      if (parent && parent.id !== db.id) addEdge(parent.id, db.id, "contains", "parent-child", file.path, file.path);
    }
    const raw = { format: "universal-csv-constellation/v2", nodes: Array.from(nodes.values()), edges };
    const ids = new Set(raw.nodes.map(n => n.id));
    const errors = [];
    if (!raw.nodes.length) errors.push("No Notion pages or database entries were found.");
    if (raw.edges.some(e => !ids.has(e.source) || !ids.has(e.target))) errors.push("An edge refers to a missing node.");
    return { nodes: raw.nodes, edges: raw.edges, diagnostics, errors, metadata: { sourceFormat: "notion", filesDiscovered: manifest.files.length, markdownPages: manifest.markdownFiles.length, databaseFiles: manifest.csvFiles.length, assets: manifest.assets.map(a => ({ path: a.path, type: a.extension })), resolvedLinks: resolved, unresolvedReferences: unresolved, duplicateIds: diagnostics.filter(d => d.code === "NOTION_DUPLICATE_ID").length, nodeTypes: stats(raw.nodes, "type"), edgeTypes: stats(raw.edges, "type") } };
  }
  async function parse(file, Zip, progress) {
    const manifest = await scanZip(file, Zip, progress);
    const discovery = await parseManifest(manifest, progress);
    const result = resolveGraph(discovery, manifest, progress);
    progress?.("Normalizing graph..."); progress?.("Running diagnostics..."); progress?.("Ready for preview.");
    return result;
  }
  const api = { normalizeNotionId, pathOf, scanZip, parseManifest, resolveReference, resolveGraph, parse };
  root.NotionImportAdapter = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
