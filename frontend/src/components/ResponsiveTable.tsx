import React from "react";

interface Column {
  key: string;
  label: string;
  render?: (row: any) => React.ReactNode;
}

interface ResponsiveTableProps {
  columns: Column[];
  data: any[];
  keyField?: string;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({ columns, data, keyField = "id" }) => {
  return (
    <>
      <div className="desktop-only" style={{ width: "100%", overflowX: "auto" }}>
        <table className="tbl">
          <thead>
            <tr>
              {columns.map(col => <th key={col.key}>{col.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row[keyField] || i}>
                {columns.map(col => (
                  <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mobile-only grid">
        {data.map((row, i) => (
          <div key={row[keyField] || i} className="card stack" style={{ gap: "12px", padding: "16px" }}>
            {columns.map((col, j) => {
              const content = col.render ? col.render(row) : row[col.key];
              // Don't render empty values on mobile
              if (content === null || content === undefined || content === "") return null;
              
              return (
                <div key={col.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                  <span style={{ fontSize: "12px", color: "var(--color-pebble)", flexShrink: 0 }}>{col.label}</span>
                  <span style={{ textAlign: "right", fontSize: "14px", fontWeight: j === 0 ? 600 : 400, color: "var(--color-obsidian)" }}>
                    {content}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
};
