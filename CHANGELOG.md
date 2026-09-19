# Changelog

## Unreleased

### Added

- Browser native import of Notion Markdown and CSV export ZIP files.
- Recursive archive discovery, stable Notion IDs, local link resolution, hierarchy and database reconstruction.
- Relationship provenance, coded diagnostics, archive safety limits, and transactional preview and apply.
- Integration with the existing visualization, topology, and persistence pipelines.

### Preserved

- Existing CSV importer and canonical graph schema.
- 2D and 3D visualization, layouts, interactions, TDA, snapshots, and persistence.
- Standalone browser operation without a backend or runtime package manager.

### Fixed

- Notion database Markdown pages and their matching `_all.csv` exports now merge as one database entity instead of producing duplicate-ID warnings.
- Markdown links containing literal parentheses now resolve without truncating their destinations.
- Database rows now match exported row pages through Notion's ID-free database folder names.
- Referenced local HTML and other supporting files are retained as asset metadata instead of reported as missing pages.
- Notion `_all.csv` download links whose files were omitted from the export are retained as missing supporting-file metadata instead of unresolved graph-link warnings.
- Sparse Notion metadata filters now include an enabled `unassigned` value, preventing all imported nodes from being hidden after reload.
