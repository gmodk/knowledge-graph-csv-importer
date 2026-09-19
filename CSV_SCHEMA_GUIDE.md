# Universal CSV graph contract

The importer has no required domain vocabulary. It infers common graph column names, shows the proposed mapping, and lets you correct every field before creating the graph.

## Option A: separate node and edge files

A node table needs an ID column. A label is recommended; all other columns become inspectable node properties.

```csv
id,label,category,score,url
n1,First node,Topic,8,https://example.com/n1
n2,Second node,Project,5,https://example.com/n2
```

An edge table needs source and target columns. Endpoints absent from the node table are created automatically.

```csv
source,target,relation,weight,directed
n1,n2,supports,0.8,true
```

## Option B: one adjacency-list file

Map a column such as `connections`, `neighbors`, or `links` as adjacency. Separate endpoint IDs with semicolons, commas, or pipes. Quote a value containing commas.

```csv
id,label,group,connections
n1,First node,Topic,"n2; n3"
n2,Second node,Topic,n3
n3,Third node,Project,
```

## Inferred roles and aliases

| Purpose | Common recognized headings |
|---|---|
| Node ID | `id`, `node_id`, `key`, `uid`, `identifier` |
| Node label | `label`, `name`, `title`, `node`, `concept` |
| Category | `category`, `group`, `class`, `cluster`, `kind`, `type` |
| Edge source | `source`, `from`, `src`, `origin`, `parent` |
| Edge target | `target`, `to`, `dst`, `destination`, `child` |
| Relation | `relation`, `relationship`, `edge_type`, `predicate` |
| Weight | `weight`, `strength`, `score`, `distance`, `cost` |
| Adjacency | `connections`, `neighbors`, `links`, `adjacent`, `targets` |

The parser detects comma, semicolon, tab, and pipe delimiters and supports quoted cells, escaped quotes, and multiline values.

## Generated controls

- Categorical columns with a practical number of distinct values become filter groups and can drive color or clustering.
- Mostly numeric columns become color and size encodings.
- Every edge relation value becomes an independent relation toggle.
- An imported edge weight drives the topology filtration slider.
- Every original cell remains available in the node inspector and exported normalized JSON.

Very high-cardinality text columns are intentionally kept in the inspector instead of becoming unwieldy filter groups.
