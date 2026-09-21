(function (global) {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const idOf = value => value == null ? "" : (typeof value === "object" ? String(value.id ?? value.key ?? "") : String(value));
  const nodeLabel = node => String(node?.label ?? node?.name ?? node?.title ?? node?.id ?? "");
  const edgeType = edge => String(edge?.type ?? edge?.relation ?? edge?.kind ?? "");
  const normalizeRelation = value => String(value || "").trim().toLowerCase().replace(/[_\s]+/g, "-");

  function svgElement(name, attributes = {}) {
    const element = document.createElementNS(SVG_NS, name);
    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== undefined && value !== null) element.setAttribute(key, String(value));
    });
    return element;
  }

  function polar(cx, cy, radius, angle) {
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  }

  function arcPath(cx, cy, innerRadius, outerRadius, startAngle, endAngle) {
    const span = Math.max(0, Math.min(Math.PI * 2 - 1e-6, endAngle - startAngle));
    if (span <= 1e-8 || outerRadius <= innerRadius) return "";
    const end = startAngle + span;
    const p1 = polar(cx, cy, outerRadius, startAngle), p2 = polar(cx, cy, outerRadius, end);
    const p3 = polar(cx, cy, innerRadius, end), p4 = polar(cx, cy, innerRadius, startAngle);
    const large = span > Math.PI ? 1 : 0;
    return innerRadius <= 1e-8
      ? `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${outerRadius} ${outerRadius} 0 ${large} 1 ${p2.x} ${p2.y} Z`
      : `M ${p1.x} ${p1.y} A ${outerRadius} ${outerRadius} 0 ${large} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${innerRadius} ${innerRadius} 0 ${large} 0 ${p4.x} ${p4.y} Z`;
  }

  function hash(value) {
    let result = 2166136261;
    for (let i = 0; i < value.length; i += 1) { result ^= value.charCodeAt(i); result = Math.imul(result, 16777619); }
    return result >>> 0;
  }

  function color(key, depth) {
    const hue = hash(key || "root") % 360, saturation = Math.max(40, 68 - depth * 3), lightness = Math.min(72, 42 + depth * 5);
    return `hsl(${hue} ${saturation}% ${lightness}%)`;
  }

  class ConstellationSunburst {
    constructor(container, options = {}) {
      if (!container) throw new Error("ConstellationSunburst requires a container.");
      this.container = container;
      this.options = {
        syntheticRootId: "__workspace__",
        syntheticRootLabel: "Workspace",
        hierarchyRelationPriority: ["contains", "parent-child", "database-membership", "hierarchy", "subpage"],
        rootId: null,
        maxDepth: Infinity,
        sizeMode: "subtree",
        showLabels: true,
        minLabelAngle: 0.075,
        minLabelArcPx: 30,
        ringGap: 2,
        sectorGapRadians: 0.004,
        centerRadiusRatio: 0.12,
        isNodeVisible: null,
        isEdgeVisible: null,
        onNodeClick: null,
        onNodeFocus: null,
        onDiagnostics: null,
        ...options
      };
      this.graph = { nodes: [], edges: [] };
      this.projection = null;
      this.focusId = null;
      this.selectedId = null;
      this._build();
      this._bindResize();
    }

    _build() {
      this.container.innerHTML = "";
      this.container.classList.add("constellation-sunburst-host");
      this.shell = document.createElement("div");
      this.shell.className = "constellation-sunburst";
      this.toolbar = document.createElement("div");
      this.toolbar.className = "constellation-sunburst__toolbar";
      this.homeBtn = document.createElement("button");
      this.homeBtn.textContent = "Home";
      this.homeBtn.className = "constellation-sunburst__button";
      this.homeBtn.onclick = () => this.resetFocus();
      this.backBtn = document.createElement("button");
      this.backBtn.textContent = "Back";
      this.backBtn.className = "constellation-sunburst__button";
      this.backBtn.onclick = () => this.focusParent();
      this.breadcrumb = document.createElement("div");
      this.breadcrumb.className = "constellation-sunburst__breadcrumb";
      this.toolbar.append(this.homeBtn, this.backBtn, this.breadcrumb);
      this.stage = document.createElement("div");
      this.stage.className = "constellation-sunburst__stage";
      this.svg = svgElement("svg", { class: "constellation-sunburst__svg", role: "img", "aria-label": "Sunburst hierarchy" });
      this.tooltip = document.createElement("div");
      this.tooltip.className = "constellation-sunburst__tooltip";
      this.tooltip.hidden = true;
      this.stage.append(this.svg, this.tooltip);
      this.shell.append(this.toolbar, this.stage);
      this.container.append(this.shell);
    }

    _bindResize() {
      const callback = () => this.projection && this.render();
      if ("ResizeObserver" in global) { this._resizeObserver = new global.ResizeObserver(callback); this._resizeObserver.observe(this.container); }
      else { this._resizeCallback = callback; global.addEventListener("resize", callback); }
    }

    destroy() {
      if (this._resizeObserver) this._resizeObserver.disconnect();
      if (this._resizeCallback) global.removeEventListener("resize", this._resizeCallback);
      this.container.innerHTML = "";
    }

    setOptions(options = {}) {
      this.options = { ...this.options, ...options };
      if (this.graph) this.setGraph(this.graph, { preserveFocus: true });
      return this;
    }

    setGraph(graph, behavior = {}) {
      const previousFocus = this.focusId;
      this.graph = graph || { nodes: [], edges: [] };
      this.projection = ConstellationSunburst.projectHierarchy(this.graph, this.options);
      const configuredRoot = this.options.rootId && this.projection.byId.has(String(this.options.rootId)) ? String(this.options.rootId) : this.projection.root.id;
      this.focusId = behavior.preserveFocus && previousFocus && this.projection.byId.has(previousFocus) ? previousFocus : configuredRoot;
      if (this.selectedId && !this.projection.byId.has(this.selectedId)) this.selectedId = null;
      if (typeof this.options.onDiagnostics === "function") this.options.onDiagnostics(this.projection.diagnostics.slice());
      this.render();
      return this;
    }

    refresh() { return this.setGraph(this.graph, { preserveFocus: true }); }
    getProjection() { return this.projection; }
    getDiagnostics() { return this.projection ? this.projection.diagnostics.slice() : []; }

    setSelected(id) {
      this.selectedId = id == null ? null : String(id);
      this.render();
      return this;
    }

    focusNode(id) {
      if (!this.projection) return;
      const key = String(id);
      if (!this.projection.byId.has(key)) return;
      this.focusId = key;
      this.render();
      if (typeof this.options.onNodeFocus === "function") this.options.onNodeFocus(this.projection.byId.get(key));
    }

    focusParent() {
      const node = this.projection?.byId.get(this.focusId);
      const configuredRoot = this.options.rootId == null ? null : String(this.options.rootId);
      if (node?.parent && node.id !== configuredRoot) this.focusNode(node.parent.id);
    }

    resetFocus() {
      if (!this.projection) return;
      const root = this.options.rootId && this.projection.byId.has(String(this.options.rootId)) ? String(this.options.rootId) : this.projection.root.id;
      this.focusNode(root);
    }

    render() {
      if (!this.projection || this.container.hidden) return;
      const width = Math.max(320, this.stage.clientWidth || this.container.clientWidth || 900);
      const height = Math.max(320, this.stage.clientHeight || this.container.clientHeight || 620);
      this.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      this.svg.innerHTML = "";
      const focus = this.projection.byId.get(this.focusId) || this.projection.root;
      this._updateBreadcrumb(focus);
      const cx = width / 2, cy = height / 2, radius = Math.min(width, height) * 0.46;
      const centerRadius = Math.max(38, radius * this.options.centerRadiusRatio);
      const availableDepth = this._maxDepth(focus);
      const maxDepth = Math.min(availableDepth, Number.isFinite(this.options.maxDepth) ? this.options.maxDepth : availableDepth);
      const rings = Math.max(1, maxDepth + 1), ringWidth = (radius - centerRadius) / rings, layout = [];
      this._layout(focus, -Math.PI / 2, Math.PI * 1.5, 0, layout, maxDepth);

      const center = svgElement("g", { class: "constellation-sunburst__center" });
      const centerCircle = svgElement("circle", { cx, cy, r: centerRadius - 2, fill: color(focus.id, 0), class: focus.id === this.selectedId ? "constellation-sunburst__center-circle is-selected" : "constellation-sunburst__center-circle" });
      const centerLabel = svgElement("text", { x: cx, y: cy - 3, "text-anchor": "middle", class: "constellation-sunburst__center-label" });
      const centerMeta = svgElement("text", { x: cx, y: cy + 15, "text-anchor": "middle", class: "constellation-sunburst__center-meta" });
      centerLabel.textContent = this._truncate(nodeLabel(focus.sourceNode || focus), 24);
      centerMeta.textContent = `${focus.subtreeSize} nodes`;
      center.append(centerCircle, centerLabel, centerMeta);
      this.svg.append(center);

      layout.forEach(item => {
        const inner = centerRadius + item.depth * ringWidth + this.options.ringGap;
        const outer = centerRadius + (item.depth + 1) * ringWidth - this.options.ringGap;
        const gap = Math.min(this.options.sectorGapRadians, (item.endAngle - item.startAngle) * 0.15);
        const start = item.startAngle + gap / 2, end = item.endAngle - gap / 2;
        if (end <= start) return;
        const classes = ["constellation-sunburst__sector"];
        if (item.node.id === this.selectedId) classes.push("is-selected");
        const group = svgElement("g", { class: classes.join(" "), tabindex: "0", role: "button", "data-node-id": item.node.id });
        const path = svgElement("path", { d: arcPath(cx, cy, inner, outer, start, end), class: "constellation-sunburst__arc", fill: color(item.branchKey, item.depth + 1) });
        group.append(path);
        if (this.options.showLabels && this._shouldLabel(item, inner, outer)) {
          const middleAngle = (start + end) / 2, middleRadius = (inner + outer) / 2, position = polar(cx, cy, middleRadius, middleAngle);
          let degrees = middleAngle * 180 / Math.PI;
          const normalized = ((degrees % 360) + 360) % 360;
          if (normalized > 90 && normalized < 270) degrees += 180;
          const text = svgElement("text", { x: position.x, y: position.y, "text-anchor": "middle", "dominant-baseline": "middle", transform: `rotate(${degrees} ${position.x} ${position.y})`, class: "constellation-sunburst__label" });
          text.textContent = this._truncate(nodeLabel(item.node.sourceNode || item.node), 24);
          group.append(text);
        }
        const activate = () => {
          if (typeof this.options.onNodeClick === "function") this.options.onNodeClick(item.node);
          if (item.node.children.length) this.focusNode(item.node.id);
        };
        group.addEventListener("click", activate);
        group.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(); } });
        group.addEventListener("mousemove", event => this._showTooltip(event, item.node));
        group.addEventListener("mouseleave", () => { this.tooltip.hidden = true; });
        this.svg.append(group);
      });
    }

    _layout(parent, startAngle, endAngle, depth, output, maxDepth) {
      if (depth > maxDepth || !parent.children.length) return;
      const total = parent.children.reduce((sum, child) => sum + this._weight(child), 0) || 1;
      let current = startAngle;
      parent.children.forEach((child, index) => {
        const next = index === parent.children.length - 1 ? endAngle : current + (endAngle - startAngle) * (this._weight(child) / total);
        const branchKey = depth === 0 ? child.id : (parent.branchKey || parent.id);
        child.branchKey = branchKey;
        output.push({ node: child, startAngle: current, endAngle: next, depth, branchKey });
        this._layout(child, current, next, depth + 1, output, maxDepth);
        current = next;
      });
    }

    _weight(node) {
      if (this.options.sizeMode === "equal") return 1;
      if (this.options.sizeMode === "leaves") return Math.max(1, node.leafCount);
      return Math.max(1, node.subtreeSize);
    }

    _maxDepth(node) { return node.children.length ? 1 + Math.max(...node.children.map(child => this._maxDepth(child))) : 0; }
    _shouldLabel(item, inner, outer) { const angle = item.endAngle - item.startAngle; return angle >= this.options.minLabelAngle && angle * ((inner + outer) / 2) >= this.options.minLabelArcPx; }
    _truncate(value, length) { const text = String(value ?? ""); return text.length <= length ? text : `${text.slice(0, length - 1)}…`; }

    _updateBreadcrumb(node) {
      const path = [];
      const configuredRoot = this.options.rootId == null ? null : String(this.options.rootId);
      let current = node;
      while (current) { path.push(nodeLabel(current.sourceNode || current)); if (current.id === configuredRoot) break; current = current.parent; }
      this.breadcrumb.textContent = path.reverse().join(" › ");
      this.backBtn.disabled = !node.parent || node.id === configuredRoot;
    }

    _showTooltip(event, node) {
      this.tooltip.innerHTML = "";
      const title = document.createElement("strong"), detail = document.createElement("span");
      title.textContent = nodeLabel(node.sourceNode || node);
      detail.textContent = `${node.sourceNode?.type || "node"} · ${node.subtreeSize} nodes`;
      this.tooltip.append(title, detail);
      this.tooltip.hidden = false;
      const bounds = this.stage.getBoundingClientRect();
      this.tooltip.style.left = `${Math.min(bounds.width - 240, Math.max(8, event.clientX - bounds.left + 14))}px`;
      this.tooltip.style.top = `${Math.min(bounds.height - 70, Math.max(8, event.clientY - bounds.top + 14))}px`;
    }

    static projectHierarchy(graph, options = {}) {
      const opts = {
        syntheticRootId: "__workspace__",
        syntheticRootLabel: "Workspace",
        hierarchyRelationPriority: ["contains", "parent-child", "database-membership", "hierarchy", "subpage"],
        isNodeVisible: null,
        isEdgeVisible: null,
        ...options
      };
      const diagnostics = [], rawNodes = Array.isArray(graph?.nodes) ? graph.nodes : [], rawEdges = Array.isArray(graph?.edges) ? graph.edges : [];
      const sourceNodes = new Map();
      rawNodes.forEach(node => {
        const id = idOf(node.id);
        if (!id) { diagnostics.push({ severity: "warning", code: "SUNBURST_NODE_MISSING_ID" }); return; }
        if (sourceNodes.has(id)) { diagnostics.push({ severity: "warning", code: "SUNBURST_DUPLICATE_NODE_ID", nodeId: id }); return; }
        if (typeof opts.isNodeVisible === "function" && !opts.isNodeVisible(node)) return;
        sourceNodes.set(id, node);
      });

      const priority = new Map(opts.hierarchyRelationPriority.map((type, index) => [normalizeRelation(type), index]));
      const candidates = new Map();
      rawEdges.forEach(edge => {
        const relationType = normalizeRelation(edgeType(edge));
        if (!priority.has(relationType)) return;
        if (typeof opts.isEdgeVisible === "function" && !opts.isEdgeVisible(edge)) return;
        const source = idOf(edge.source), target = idOf(edge.target);
        if (!sourceNodes.has(source) || !sourceNodes.has(target)) {
          diagnostics.push({ severity: "info", code: "SUNBURST_HIERARCHY_EDGE_MISSING_NODE", edgeId: edge.id ?? null, source, target });
          return;
        }
        if (source === target) { diagnostics.push({ severity: "warning", code: "SUNBURST_SELF_PARENT", nodeId: source }); return; }
        if (!candidates.has(target)) candidates.set(target, []);
        candidates.get(target).push({ parentId: source, edge, priority: priority.get(relationType), relationType });
      });

      candidates.forEach((list, childId) => {
        list.sort((a, b) => a.priority - b.priority || a.parentId.localeCompare(b.parentId) || String(a.edge.id ?? "").localeCompare(String(b.edge.id ?? "")));
        if (list.length > 1) diagnostics.push({ severity: "info", code: "SUNBURST_MULTIPLE_PARENTS", nodeId: childId, candidateCount: list.length });
      });

      const chosen = new Map();
      const createsCycle = (child, parent) => {
        let current = parent;
        const seen = new Set([child]);
        while (current) {
          if (seen.has(current)) return true;
          seen.add(current);
          current = chosen.get(current)?.parentId || null;
        }
        return false;
      };
      Array.from(sourceNodes.keys()).sort().forEach(child => {
        const list = candidates.get(child) || [];
        for (const candidate of list) {
          if (!createsCycle(child, candidate.parentId)) { chosen.set(child, candidate); break; }
          diagnostics.push({ severity: "warning", code: "SUNBURST_CYCLE_EDGE_IGNORED", nodeId: child, candidateParentId: candidate.parentId, edgeId: candidate.edge.id ?? null });
        }
      });

      const byId = new Map();
      sourceNodes.forEach((sourceNode, id) => byId.set(id, { id, label: nodeLabel(sourceNode), sourceNode, children: [], parent: null, parentEdge: null, subtreeSize: 1, leafCount: 1, branchKey: id }));
      const roots = [];
      Array.from(sourceNodes.keys()).sort().forEach(id => {
        const node = byId.get(id), parentChoice = chosen.get(id);
        if (parentChoice && byId.has(parentChoice.parentId)) {
          const parent = byId.get(parentChoice.parentId);
          node.parent = parent; node.parentEdge = parentChoice.edge; parent.children.push(node);
        } else roots.push(node);
      });
      byId.forEach(node => node.children.sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id)));

      let root;
      const explicitRoot = options.rootId != null ? byId.get(String(options.rootId)) : null;
      if (explicitRoot) root = explicitRoot;
      else if (roots.length === 1) root = roots[0];
      else {
        root = { id: String(opts.syntheticRootId), label: opts.syntheticRootLabel, sourceNode: null, children: roots.slice().sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id)), parent: null, parentEdge: null, subtreeSize: 1, leafCount: 1, synthetic: true, branchKey: String(opts.syntheticRootId) };
        byId.set(root.id, root);
        root.children.forEach(child => { child.parent = root; });
        diagnostics.push({ severity: "info", code: "SUNBURST_SYNTHETIC_ROOT", rootCount: roots.length });
      }

      const annotate = node => {
        if (!node.children.length) { node.subtreeSize = 1; node.leafCount = 1; return { subtree: 1, leaves: 1 }; }
        let subtree = 1, leaves = 0;
        node.children.forEach(child => { const metrics = annotate(child); subtree += metrics.subtree; leaves += metrics.leaves; });
        node.subtreeSize = subtree; node.leafCount = Math.max(1, leaves);
        return { subtree, leaves: node.leafCount };
      };
      annotate(root);
      const multipleParents = diagnostics.filter(item => item.code === "SUNBURST_MULTIPLE_PARENTS");
      multipleParents.forEach(item => { item.chosenParentId = chosen.get(item.nodeId)?.parentId || null; });
      return { root, byId, diagnostics, selectedParentByNodeId: chosen, naturalRootIds: roots.map(item => item.id) };
    }
  }

  global.ConstellationSunburst = ConstellationSunburst;
  if (typeof module !== "undefined" && module.exports) module.exports = ConstellationSunburst;
})(typeof window !== "undefined" ? window : globalThis);
