(function (root) {
  "use strict";
  const Core = root.CSVGraphCore;
  root.CSVImportAdapter = {
    async parse(files) {
      const accepted = Array.from(files || []).filter(file => /\.csv$/i.test(file.name) || /csv/i.test(file.type));
      const tables = [];
      for (const file of accepted) tables.push(Core.inferTable(file.name, Core.parseCSV(await file.text())));
      return { tables, filenames: accepted.map(file => file.name) };
    }
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
