export const Skeleton = ({
  width = "100%",
  height = 20,
  radius = "var(--radius-cards)",
  style
}) => <div
  className="skeleton"
  style={{
    width,
    height,
    borderRadius: radius,
    ...style
  }}
/>;
export const SkeletonGrid = ({ count = 6 }) => <div className="grid g4">{Array.from({ length: count }).map((_, i) => <div key={i} className="card" style={{ padding: 0, overflow: "hidden" }}><Skeleton height={140} radius="0" /><div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}><Skeleton width="40%" height={14} /><Skeleton width="75%" height={18} /><Skeleton width="55%" height={14} /><Skeleton width="30%" height={24} /><Skeleton height={36} /></div></div>)}</div>;
export const SkeletonRow = ({ count = 4 }) => <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{Array.from({ length: count }).map((_, i) => <div key={i} style={{ display: "flex", gap: 16, alignItems: "center" }}><Skeleton width={44} height={44} radius="50%" /><div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}><Skeleton width="60%" height={14} /><Skeleton width="40%" height={12} /></div><Skeleton width={80} height={14} /></div>)}</div>;
