// assets/js/utils/csv.js — Exportar/Importar CSV

export function exportToCSV(data, filename = "export.csv") {
  if (!Array.isArray(data) || data.length === 0) {
    alert("No hay datos para exportar");
    return;
  }

  const keys = Object.keys(data[0]);
  const csv = [
    keys.join(","),
    ...data.map(row =>
      keys.map(key => {
        const val = row[key];
        if (val === null || val === undefined) return "";
        if (typeof val === "object") return `"${JSON.stringify(val)}"`;
        if (typeof val === "string" && val.includes(",")) return `"${val}"`;
        return val;
      }).join(",")
    )
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function importFromCSV(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target.result;
        const lines = csv.split("\n").filter(line => line.trim());
        if (lines.length < 2) throw new Error("CSV vacío o sin encabezado");

        const headers = lines[0].split(",").map(h => h.trim());
        const data = lines.slice(1).map(line => {
          const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
          const row = {};
          headers.forEach((header, idx) => {
            row[header] = values[idx] || "";
          });
          return row;
        });

        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
