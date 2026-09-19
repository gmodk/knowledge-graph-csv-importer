# Notion ZIP import

## Supported export

In Notion, choose **Export → Markdown & CSV → Include subpages**, then download the ZIP archive.

## Import

1. Open the graph importer in a modern browser.
2. Choose **Import Notion ZIP** and select the exported `.zip` file.
3. Review the file, node, relationship, and diagnostic counts.
4. Choose **Apply import**.

The active graph is not changed during parsing or preview. Canceling a preview or encountering an invalid archive leaves the current graph intact.

## Graph mapping

- Markdown pages become `notion-page` nodes.
- CSV tables become `notion-database` nodes.
- Database rows without matching exported pages become `notion-database-entry` nodes.
- Export hierarchy and database membership become `contains` edges.
- Resolved local Markdown links become `links-to` edges.
- Explicit resolvable database relation values become `relation` edges.
- External URLs remain node metadata.
- Assets remain metadata and do not affect connectivity.
- Unresolved references produce diagnostics and never create placeholder nodes.

Notion IDs are normalized and used as stable node IDs. Objects without a Notion ID receive deterministic path or row IDs. Each edge includes provenance describing the source file and construction mechanism.

## Privacy and limits

ZIP parsing happens locally in the browser. The archive is never uploaded. The importer rejects unsafe paths and enforces file count, expanded archive size, and individual text file limits. It decodes Markdown and CSV files only; binary assets are not expanded into memory.

After normalization, Notion data uses the same graph renderer, filters, layouts, topology analysis, snapshot, and persistence paths as CSV data.
