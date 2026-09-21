# Universal CSV Constellation

A local-first browser project for canonical graph CSV files and Notion Markdown/CSV export ZIP archives. It previews imports before replacement and derives layers, relations, semantic axes, analytics, and gravity controls from normalized graph properties.

## Use it

Open `universal-csv-graph-importer.html` directly in a modern browser. No server, account, API key, or build step is required.

1. Drop the node and edge CSV files into the import zone together.
2. Review each file's role and inferred columns in the preview modal.
3. Choose **apply snapshot**. Canceling or closing the modal preserves the active graph.
4. Explore the same canonical graph in 2D, 3D, Sunburst, or TDA, with generated layers and relation filters, force/semantic/hierarchical/cluster/radial layouts, recursive source/outcome context, analytics, gravity, adaptive labels, and persistent topology.

Sunburst is a display-only hierarchy projection. It recognizes `contains`, `parent-child`, `database-membership`, `hierarchy`, and `subpage` relations in that priority order, resolves display parents deterministically, rejects cycles, and uses a synthetic **Workspace** root when needed. Its root, sector-size, depth, and label controls do not modify or duplicate the stored graph.

For a Notion export, choose **Import Notion ZIP**, review the generated pages, databases, relationships, and diagnostics, then choose **Apply import**. See [docs/notion-import.md](docs/notion-import.md).

The original modular source starts at `index.html`. To rebuild the standalone file, run:

```bash
npm run bundle
```

Run the dependency-free tests with:

```bash
npm test
```

## Input contract

- Knowledge graph node and edge CSV files
- Notion Markdown and CSV export ZIP archives
- One or more node tables plus one or more edge tables
- Endpoint IDs missing from node tables are diagnosed and generated
- Comma, semicolon, tab, and pipe-delimited files

See `CSV_SCHEMA_GUIDE.md` and `examples/` for mappings and sample data.

### Comprehensive science sample

Import these two files together:

- `examples/science_world_nodes.csv`
- `examples/science_world_edges.csv`

The expanded science atlas contains 3,815 nodes and 4,669 connections. It spans mathematical sciences, statistics, physics, astronomy, chemistry, materials science, Earth and climate science, oceanography, environmental science, organismal and evolutionary biology, genetics, biochemistry, microbiology, neuroscience, cognitive science, medicine, public health, computer science, AI, engineering, quantum technology, agriculture, complex systems, social sciences, and science studies. It includes fields, subjects, topics, theoretical lenses, methods, applications, named theorems and hypotheses, and active research frontiers.

Its `importance` and `complexity` columns are synthetic ordinal scores designed to exercise numeric graph encodings. Edge `weight` is likewise a synthetic conceptual-strength value for testing the filtration control; it is not an empirical measurement or a claim about causal effect size. The high-level `relation` field keeps the display manageable, while `relation_detail` preserves the more specific connection verb.

Run `npm run bundle` to regenerate the curated core, expand it into the complete atlas, embed it as the bundled snapshot, and rebuild the standalone application.

See `SCIENCE_ATLAS_SCOPE.md` for taxonomy, coverage, and epistemic limitations.

### Modular science CSVs

The `examples/science_modules/` directory separates the atlas into semantic domains. Each domain has a matching `*_nodes.csv` and `*_edges.csv` pair, including `mathematical_sciences`, `fundamental_physics`, `computer_science`, `neuroscience`, and all other atlas domains.

- To explore one domain, import its matching node and edge files together.
- To combine several domains, import all matching pairs in one operation.
- When importing all 27 modules, add `cross_domain_edges.csv` to restore the complete interdisciplinary structure.
- When combining only a subset of domains, either omit the bridge file or filter it by `source_module` and `target_module` so both modules are in your chosen subset.
- To explore the interdisciplinary layer by itself, import `cross_domain_nodes.csv` with `cross_domain_edges.csv`.
- `module_manifest.csv` lists every module, filename, node count, internal-edge count, and bridge-edge count.

Every ordinary module is independently valid: its edge file references only nodes in its matching node file. The original `science_world_nodes.csv` and `science_world_edges.csv` remain available as monolithic compatibility files and as the source for the embedded standalone sample.

## Privacy and persistence

CSV contents and Notion ZIP archives are parsed locally in the browser and are not uploaded by this project. No Node.js, npm runtime, server, or build system is required to use the application. The applied normalized graph and import provenance are stored in IndexedDB, which can accommodate the multi-megabyte science atlas without hitting the small `localStorage` quota. Legacy `localStorage` snapshots remain readable as a compatibility fallback. **Restore bundled** removes the imported snapshot from both stores after confirmation and returns to the included science graph.

Mouse-wheel and trackpad zoom use an independent exponential camera scale from 2% to 1,000,000% of the default view. The zoom badge reports the current scale, **home** returns to 100%, and **fit** returns to an overview scale.

## Performance note

The canvas renderer is designed for exploratory, medium-sized graphs. Above roughly 460 nodes, the runtime skips quadratic pairwise repulsion while retaining relation springs, semantic anchoring, layout transitions, and interaction.

See `FEATURE_PARITY.md` for the Notion-to-CSV capability map.
