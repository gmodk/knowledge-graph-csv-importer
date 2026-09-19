# Universal CSV Science Atlas — Model Handoff

## Purpose

This document summarizes the completed expansion of the Universal CSV Graph Importer sample into a large, cross-disciplinary map of science. It is intended to be attached to another AI model so that the model can understand the current project state, data model, implementation choices, validation status, and limitations without relying on the original conversation.

## User objective

Build an extremely comprehensive map of science for the existing 3D/2D constellation application. The map should include:

- scientific domains, disciplines, subjects, and topics;
- theories, theorems, hypotheses, conjectures, laws, principles, theses, and models;
- methods, instruments, applications, and phenomena;
- contemporary or emerging research frontiers;
- cross-disciplinary relationships;
- thousands of nodes rather than a small demonstration dataset.

The resulting files must work with the Universal CSV Graph Importer, whose behavior should remain aligned with the earlier Notion constellation project while accepting ordinary CSV node and connection tables.

## Completed result

| Metric | Result |
|---|---:|
| Nodes | 3,815 |
| Normalized connections | 4,669 |
| Broad domain labels | 37 |
| Discipline and subdiscipline labels | 238 |
| Node categories | 23 |
| Research-frontier nodes | 773 |
| Landmark mathematical/scientific statements | 784 |
| High-level relation families | 9 |
| Dangling connections | 0 |
| Duplicate normalized connections | 0 |
| Missing node identifiers | 0 |
| Missing connection endpoints | 0 |

Here, “landmark statements” collectively means nodes categorized as theories, theorems, hypotheses, conjectures, laws, principles, theses, or models.

## Scientific scope

The atlas includes substantial coverage of:

1. mathematical sciences;
2. probability, statistics, and data science;
3. fundamental physics;
4. astronomy, cosmology, and space science;
5. chemistry;
6. materials science and nanotechnology;
7. Earth and geosciences;
8. climate and atmospheric science;
9. ocean and marine science;
10. environmental science and ecology;
11. organismal and developmental biology;
12. evolutionary biology;
13. genetics, genomics, and epigenetics;
14. biochemistry and molecular biology;
15. microbiology, virology, and immunology;
16. neuroscience and neurobiology;
17. cognitive and behavioral sciences;
18. medicine and health sciences;
19. public health and epidemiology;
20. computer science;
21. artificial intelligence and machine learning;
22. engineering;
23. quantum science and technology;
24. agricultural, food, and veterinary sciences;
25. systems and complexity science;
26. social and economic sciences;
27. philosophy, history, and methodology of science.

The number of distinct values in the `domain` column is larger than this list because some inherited core-dataset labels and specialized domain labels are retained.

## Conceptual hierarchy

The generated atlas combines a manually curated core with a systematic hierarchy:

1. broad scientific domain;
2. field or discipline;
3. scientific subject or topic;
4. theoretical foundations;
5. methods and instruments;
6. open questions and research frontiers;
7. applications and implications;
8. named scientific landmarks and cross-disciplinary programs.

Each concrete topic can receive four associated research-lens nodes:

- theoretical foundations;
- methods and instruments;
- open questions;
- applications and implications.

These research-lens nodes support consistent exploration across thousands of subjects. They do not imply that a topic has only one canonical theory, method, open problem, or application.

## Node CSV schema

Filename: `science_world_nodes.csv`

```text
id,label,category,domain,discipline,level,importance,complexity,status,source_scope,description
```

| Column | Meaning |
|---|---|
| `id` | Stable unique machine identifier used by connections. |
| `label` | Human-readable node name. |
| `category` | Semantic type, such as discipline, field, topic, theorem, theory, hypothesis, method, application, or research frontier. |
| `domain` | Broad scientific grouping used for color, filtering, and clustering. |
| `discipline` | More specific field or subfield. |
| `level` | Hierarchical or conceptual level. |
| `importance` | Synthetic ordinal visualization score. |
| `complexity` | Synthetic ordinal visualization score. |
| `status` | General status classification, including established or frontier-oriented states. |
| `source_scope` | Indicates whether the node came from the manually curated core or the expanded atlas taxonomy. |
| `description` | Concise explanatory text. |

Representative node categories include:

- `discipline`
- `field`
- `topic`
- `theory`
- `theorem`
- `hypothesis`
- `conjecture`
- `law`
- `principle`
- `thesis`
- `model`
- `method`
- `process`
- `phenomenon`
- `object`
- `technology`
- `application`
- `research frontier`

## Connection CSV schema

Filename: `science_world_edges.csv`

```text
source,target,relation,relation_detail,weight,directed,relation_family,provenance
```

| Column | Meaning |
|---|---|
| `source` | Identifier of the source node. |
| `target` | Identifier of the target node. |
| `relation` | High-level display relation used by filters and gravity controls. |
| `relation_detail` | More specific conceptual verb or relation description. |
| `weight` | Synthetic conceptual-strength value used for visualization and persistence filtration. |
| `directed` | Whether the relationship should be interpreted directionally. |
| `relation_family` | Explicit copy of the high-level relation family. |
| `provenance` | Indicates the generation or curation source of the edge. |

The nine high-level relation families are:

1. structure;
2. foundation;
3. generalization;
4. explanation;
5. association;
6. interaction;
7. process;
8. application;
9. information flow.

The division between `relation` and `relation_detail` is deliberate. Thousands of highly specific relation verbs would make the DISPLAY panel unusable. The high-level field produces manageable controls, while `relation_detail` preserves semantic specificity.

## Cross-disciplinary bridges

The integrity tests explicitly verify representative bridges such as:

- differential geometry → general relativity;
- graph theory → network science;
- predictive coding → Bayesian inference;
- quantum mechanics → quantum computing;
- carbon cycle ↔ photosynthesis;
- machine learning → genomics.

The broader atlas also includes frontier programs such as formalized mathematics, the Langlands program, quantum gravity, mechanistic interpretability, fault-tolerant quantum computing, exoplanet biosignatures, spatial transcriptomics, climate tipping-point detection, and whole-brain connectomics.

## Importer behavior retained

The Universal CSV Graph Importer continues to provide:

- simultaneous two-CSV preview and import diagnostics;
- automatic node-table and edge-table inference;
- force, semantic, hierarchical, clustered, and radial layouts;
- 3D and 2D constellation modes;
- directed upstream and downstream traversal;
- category and relation visibility toggles;
- per-category gravity controls;
- adaptive labels that appear as the user zooms;
- search and node inspection;
- degree, PageRank, reachability, and component metrics;
- topological data analysis controls;
- persistent curves and persistence barcodes;
- optional area filling for cycle analysis;
- large browser-local snapshots stored in IndexedDB, graph export, and screenshots;
- compatibility loading for snapshots created by earlier `localStorage` builds;
- exponential 2D/3D zoom from 2% to 1,000,000% with a live zoom indicator.

For this larger atlas, the categorical-field inference threshold was increased from 30 to 64 unique values. This ensures that the 37-value `domain` field remains available as a DISPLAY color, filter, and clustering dimension, while still excluding nearly unique identifier-like fields.

The local-focus visibility calculation was also optimized by caching the active local-node set rather than recomputing a neighborhood for every node.

## Topological data analysis interpretation

The application treats connection weights as filtration parameters. It can construct a sequence of thresholded graphs and report changes in connected components and graph cycles.

For a graph with vertex set \(V\), edge set \(E\), and \(c\) connected components, the cycle rank of the one-dimensional graph is

```text
β₁ = |E| − |V| + c.
```

Area filling allows selected cycles to be interpreted as filled two-dimensional cells. This can reduce the first Betti number when a detected loop is treated as the boundary of a filled region rather than as a persistent one-dimensional hole.

Important limitation: the CSV `weight` values are synthetic conceptual-strength values. Persistence results therefore demonstrate structural behavior of the ontology and interface; they are not empirical scientific measurements.

## Generation pipeline

The dataset is reproducible. The build order is:

1. generate the manually curated core dataset;
2. expand the core into the full science atlas;
3. convert the expanded CSVs into embedded sample data;
4. build the self-contained standalone HTML application.

The complete command is:

```bash
npm run bundle
```

Its underlying sequence is equivalent to:

```bash
node examples/build_science_sample.mjs
node examples/expand_science_atlas.mjs
node make-sample-data.mjs
node bundle.mjs
```

## Important project files

```text
universal-csv-graph-importer/
├── README.md
├── SCIENCE_ATLAS_SCOPE.md
├── CSV_SCHEMA_GUIDE.md
├── FEATURE_PARITY.md
├── index.html
├── universal-csv-graph-importer.html
├── bundle.mjs
├── make-sample-data.mjs
├── package.json
├── examples/
│   ├── build_science_sample.mjs
│   ├── expand_science_atlas.mjs
│   ├── science_world_nodes.csv
│   └── science_world_edges.csv
├── src/
│   ├── app.js
│   ├── csv-core.js
│   ├── graph-core.js
│   ├── topology.js
│   └── sample-data.js
└── tests/
    ├── core.test.cjs
    ├── parity.test.cjs
    ├── science-sample.test.cjs
    ├── static.test.cjs
    └── topology.test.cjs
```

## Validation completed

Twenty-four automated tests pass. They cover:

- quoted, multiline, semicolon-delimited, and tab-delimited CSV parsing;
- automatic table-role inference;
- edge-only and adjacency-list normalization;
- categorical and numeric display-schema inference;
- graph components and cycle rank;
- complete constellation control-surface presence;
- large-snapshot IndexedDB persistence and legacy-storage compatibility;
- independent high-range exponential zoom;
- absence of a Notion ZIP dependency in the universal import layer;
- exact science-atlas node and edge counts;
- requested discipline hubs;
- directed and weighted fields;
- cross-disciplinary bridges;
- frontier and landmark coverage;
- relation detail and provenance;
- local asset integrity;
- self-contained standalone HTML construction;
- directed recursive context;
- one-dimensional persistent cycles;
- area-filled cycle behavior;
- semantic, hierarchical, clustered, and radial layout coverage.

The final integrity audit found:

```text
dangling connections:          0
duplicate normalized edges:    0
missing node IDs:              0
missing edge endpoints:        0
```

## Current deliverables

- `science_world_nodes.csv`: approximately 1.1 MB.
- `science_world_edges.csv`: approximately 833 KB.
- `universal-csv-graph-importer.html`: approximately 2.0 MB and self-contained.
- `universal-csv-graph-importer-project.zip`: complete source project and datasets.
- `SCIENCE_ATLAS_SCOPE.md`: scope, taxonomy anchors, and interpretation limits.

Checksums of the completed artifacts at build time:

```text
science_world_nodes.csv
SHA-256 de9ea09e8db167b8096774304f5247bbd977d383af47eec50a7a7fd467f023e0

science_world_edges.csv
SHA-256 1b8f18bb8e07336d2758746048c8f7a7e27d361b80710bfb483520c948e12391

universal-csv-graph-importer.html
SHA-256 c14946ef953fe4d5fb58f8af42dbd0eab90dd8b126809742c62e740c06735e1e

universal-csv-graph-importer-project.zip
SHA-256 ac07b357b3b73acdeb4e25798bb2af35b6be9067af09837948d9365a0841c468
```

## Taxonomy references

The overall scientific coverage and terminology were conceptually aligned with these authoritative classification resources:

- OECD, *Frascati Manual 2015*: <https://www.oecd.org/en/publications/frascati-manual-2015_9789264239012-en.html>
- arXiv category taxonomy: <https://arxiv.org/category_taxonomy>
- NIH Research, Condition, and Disease Categorization: <https://report.nih.gov/funding/categorical-spending#/>
- U.S. National Science Foundation focus areas: <https://www.nsf.gov/focus-areas>

These sources anchor broad scope and terminology. They do not certify every individual generated node or relationship.

## Interpretation limits

1. No finite dataset is literally exhaustive of all scientific knowledge.
2. This atlas is a navigational ontology, not a definitive classification of science.
3. Individual nodes and edges were not verified one by one against primary literature.
4. `importance`, `complexity`, and connection `weight` are synthetic visualization parameters.
5. A connection may represent a structural, explanatory, methodological, historical, or application relationship; it is not automatically causal.
6. “Research frontier” means an active, emerging, or plausibly open research direction. It does not establish novelty, funding priority, consensus, or equal importance across fields.
7. Generic research-lens nodes are systematic navigational aids rather than claims that each topic has a unique canonical method or open question.

## Recommended instructions for a receiving model

When continuing this project:

1. preserve the two-table node/connection contract;
2. preserve stable node IDs when editing labels or descriptions;
3. avoid creating edges whose endpoints are absent from the node table;
4. deduplicate connections by normalized `(source, target, relation)` identity;
5. use `relation` for a small number of display families and `relation_detail` for semantic precision;
6. distinguish verified scientific statements from generated ontology structure;
7. do not interpret synthetic weights as empirical evidence;
8. rerun the complete test suite after changing the generator, schemas, topology implementation, or UI controls;
9. rebuild the embedded sample data and standalone HTML after modifying either CSV;
10. treat comprehensiveness as an iterative goal: refine weak areas rather than claiming final exhaustiveness.

## Suggested next improvements

- Add stable external identifiers such as DOI, Wikidata, ORCID, MSC, MeSH, ACM CCS, PACS-derived mappings, or arXiv categories where appropriate.
- Add bibliographic provenance at the individual landmark-node and edge level.
- Introduce temporal metadata for hypotheses, discoveries, and research-frontier status.
- Separate epistemic status from research activity: established, supported, disputed, open, falsified, superseded, or speculative.
- Add confidence scores derived from sources rather than synthetic visualization weights.
- Audit each discipline with domain experts or authoritative subject ontologies.
- Add lazy rendering, level-of-detail aggregation, or Web Workers if the atlas grows from thousands to tens of thousands of nodes.
- Create discipline-specific CSV modules that can be merged into the universal atlas.

## Concise status statement

The project now contains a reproducible, validated, multi-thousand-node science atlas that can be imported directly into the universal 3D/2D constellation application. It is broad enough to demonstrate a global map of scientific knowledge and its cross-disciplinary structure, while remaining explicitly framed as an editable exploratory ontology rather than an exhaustive or fully source-certified representation of science.
