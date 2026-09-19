(function (root) {
  "use strict";
  function low(bits) { return bits.toString(2).length - 1; }
  function runFiltration(nodes, edges, epsilon) {
    const parent = new Map(), sizes = new Map(); nodes.forEach(n => { parent.set(n.id, n.id); sizes.set(n.id, 1); });
    function find(x) { let r = x; while (parent.get(r) !== r) r = parent.get(r); while (parent.get(x) !== x) { const next = parent.get(x); parent.set(x, r); x = next; } return r; }
    const mergeEdgeIds = new Set(), cycleEdgeIds = new Set(); let edgeCount = 0;
    edges.forEach(e => { if (e.filterWeight > epsilon) return; edgeCount += 1; let a = find(e.a.id), b = find(e.b.id); if (a !== b) { if ((sizes.get(a) || 1) < (sizes.get(b) || 1)) [a, b] = [b, a]; parent.set(b, a); sizes.set(a, (sizes.get(a) || 1) + (sizes.get(b) || 1)); mergeEdgeIds.add(e.id); } else cycleEdgeIds.add(e.id); });
    const rootByNode = new Map(), componentSizes = new Map(); nodes.forEach(n => { const r = find(n.id); rootByNode.set(n.id, r); componentSizes.set(r, (componentSizes.get(r) || 0) + 1); });
    return { components: componentSizes.size, beta1: cycleEdgeIds.size, edgeCount, mergeEdgeIds, cycleEdgeIds, rootByNode, componentSizes };
  }
  function detectFaces(nodes, edges, maxFaces) {
    const edgeByPair = new Map(), neighbors = new Map(nodes.map(n => [n.id, new Set()]));
    edges.forEach(e => { const key = [e.a.id, e.b.id].sort().join("~"); if (!edgeByPair.has(key) || edgeByPair.get(key).filterWeight > e.filterWeight) edgeByPair.set(key, e); neighbors.get(e.a.id)?.add(e.b.id); neighbors.get(e.b.id)?.add(e.a.id); });
    const ids = nodes.map(n => n.id).sort(), faces = [], seen = new Set();
    for (let i = 0; i < ids.length && faces.length < maxFaces; i += 1) for (let j = i + 1; j < ids.length && faces.length < maxFaces; j += 1) {
      const a = ids[i], b = ids[j], shared = Array.from(neighbors.get(a) || []).filter(x => neighbors.get(b)?.has(x)).sort();
      for (let x = 0; x < shared.length && faces.length < maxFaces; x += 1) for (let y = x + 1; y < shared.length && faces.length < maxFaces; y += 1) {
        const c = shared[x], d = shared[y], vertices = [a, c, b, d], signature = vertices.slice().sort().join("|"); if (seen.has(signature)) continue; seen.add(signature);
        const boundary = [[a, c], [c, b], [b, d], [d, a]].map(pair => edgeByPair.get(pair.sort().join("~"))); if (boundary.every(Boolean)) faces.push({ id: `f:${signature}`, vertices, edges: boundary, birth: Math.max(...boundary.map(e => e.filterWeight)) });
      }
    }
    return faces;
  }
  function independentFaces(edges, faces) {
    const index = new Map(edges.map((e, i) => [e.id, i])), basis = new Map(), chosen = [];
    faces.slice().sort((a, b) => a.birth - b.birth || a.id.localeCompare(b.id)).forEach(face => { let boundary = 0n; face.edges.forEach(e => boundary ^= 1n << BigInt(index.get(e.id))); while (boundary && basis.has(low(boundary))) boundary ^= basis.get(low(boundary)); if (boundary) { basis.set(low(boundary), boundary); chosen.push(face); } }); return chosen;
  }
  function persistentHomology(nodes, edges, faces) {
    const cells = []; nodes.forEach(n => cells.push({ key: `v:${n.id}`, dim: 0, weight: 0, boundary: [] })); edges.forEach(e => cells.push({ key: `e:${e.id}`, dim: 1, weight: e.filterWeight, boundary: [`v:${e.a.id}`, `v:${e.b.id}`] })); faces.forEach(f => cells.push({ key: `f:${f.id}`, dim: 2, weight: f.birth, boundary: f.edges.map(e => `e:${e.id}`) }));
    cells.sort((a, b) => a.weight - b.weight || a.dim - b.dim || a.key.localeCompare(b.key)); const index = new Map(cells.map((c, i) => [c.key, i])), reduced = [], pivotOwner = new Map(), births = [], pairs = new Map();
    cells.forEach((cell, j) => { let column = 0n; cell.boundary.forEach(key => { const i = index.get(key); if (i !== undefined) column ^= 1n << BigInt(i); }); while (column) { const pivot = low(column), owner = pivotOwner.get(pivot); if (owner === undefined) break; column ^= reduced[owner]; } reduced[j] = column; if (column === 0n) births.push(j); else { const pivot = low(column); pivotOwner.set(pivot, j); pairs.set(pivot, j); } });
    return births.map(i => ({ dim: cells[i].dim, birth: cells[i].weight, death: pairs.has(i) ? cells[pairs.get(i)].weight : null })).filter(x => x.death === null || x.death > x.birth + 1e-12);
  }
  function betti(intervals, dim, epsilon) { return intervals.filter(x => x.dim === dim && x.birth <= epsilon && (x.death === null || x.death > epsilon)).length; }
  function analyze(nodes, edges, epsilon, fillAreas) {
    edges = edges.slice().sort((a, b) => a.filterWeight - b.filterWeight || a.id.localeCompare(b.id)); const candidates = fillAreas ? detectFaces(nodes, edges, 800) : [], faces = fillAreas ? independentFaces(edges, candidates) : [], intervals = persistentHomology(nodes, edges, faces), current = runFiltration(nodes, edges, epsilon), activeFaces = faces.filter(f => f.birth <= epsilon), curves = [];
    for (let i = 0; i <= 40; i += 1) curves.push({ epsilon: i / 40, beta0: betti(intervals, 0, i / 40), beta1: betti(intervals, 1, i / 40), beta2: betti(intervals, 2, i / 40) });
    const h = dim => intervals.filter(x => x.dim === dim).map(x => [x.birth, x.death == null ? 1 : x.death]); const roots = Array.from(current.componentSizes.keys()).sort(), componentIndex = new Map(roots.map((r, i) => [r, i])), colors = ["#72e5ff", "#ff8fd8", "#a4ef9b", "#ffd36e", "#ad9cff", "#72a8ff", "#ff9c72", "#7cf0cf"], componentColorByNode = new Map(), componentIndexByNode = new Map();
    current.rootByNode.forEach((r, id) => { const index = componentIndex.get(r) || 0; componentColorByNode.set(id, colors[index % colors.length]); componentIndexByNode.set(id, index + 1); });
    return { nodes, edges, current, candidates, faces, activeFaces, intervals, h0: h(0), h1: h(1), h2: h(2), curves, beta0: betti(intervals, 0, epsilon), beta1: betti(intervals, 1, epsilon), beta2: betti(intervals, 2, epsilon), euler: nodes.length - current.edgeCount + activeFaces.length, largest: Math.max(0, ...current.componentSizes.values()), componentColorByNode, componentIndexByNode };
  }
  const api = { runFiltration, detectFaces, independentFaces, persistentHomology, analyze };
  root.CSVGraphTopology = api; if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
