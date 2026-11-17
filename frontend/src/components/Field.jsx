import { Typography } from "./ui/Typography";
export const Field = ({ label, children }) => <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}><Typography variant="caption" style={{ textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, color: "var(--color-slate)" }}>{label}</Typography>{children}</div>;
