import React from "react";

interface DeliveryTrackProps {
  status: string;
}

export const DeliveryTrack: React.FC<DeliveryTrackProps> = ({ status }) => {
  const steps = ["Accepted", "On the way", "Delivered"];
  const statusKeys = ["accepted", "out_for_delivery", "delivered"];
  const currentIdx = Math.max(0, statusKeys.indexOf(status));

  return (
    <div style={{ width: "100%", padding: "8px 0" }}>
      <div style={{
        width: "100%",
        height: "6px",
        backgroundColor: "var(--color-fog)",
        borderRadius: "var(--radius-full)",
        overflow: "hidden",
        marginBottom: "10px",
      }}>
        <div style={{
          width: `${((currentIdx + 1) / steps.length) * 100}%`,
          height: "100%",
          backgroundColor: "var(--color-lime-voltage)",
          transition: "width 0.3s ease",
        }} />
      </div>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        {steps.map((label, idx) => {
          const isDone = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <div
              key={label}
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: "12px",
                fontWeight: isCurrent ? 600 : 500,
                color: isDone ? "var(--color-forest-ink)" : "var(--color-pebble)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: isDone ? "var(--color-forest-ink)" : "var(--color-pebble)",
                }}
              />
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
};
