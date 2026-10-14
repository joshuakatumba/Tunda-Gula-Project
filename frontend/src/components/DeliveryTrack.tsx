import React from "react";

interface DeliveryTrackProps {
  status: string;
}

export const DeliveryTrack: React.FC<DeliveryTrackProps> = ({ status }) => {
  const steps = ["Accepted", "On the way", "Delivered"];
  const statusKeys = ["accepted", "out_for_delivery", "delivered"];
  const currentIdx = Math.max(0, statusKeys.indexOf(status));

  return (
    <div style={{ width: "100%", padding: "16px 0", position: "relative" }}>
      {/* Background line */}
      <div style={{
        position: "absolute",
        top: "23px",
        left: "15%",
        right: "15%",
        height: "4px",
        backgroundColor: "var(--color-fog)",
        zIndex: 1,
      }} />
      {/* Active line */}
      <div style={{
        position: "absolute",
        top: "23px",
        left: "15%",
        width: `${(currentIdx / (steps.length - 1)) * 70}%`,
        height: "4px",
        backgroundColor: "var(--color-lime-voltage)",
        zIndex: 2,
        transition: "width 0.3s ease",
      }} />
      
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        position: "relative",
        zIndex: 3,
      }}>
        {steps.map((label, idx) => {
          const isDone = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <div
              key={label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flex: 1,
                gap: "8px",
              }}
            >
              <div style={{
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                backgroundColor: isDone ? "var(--color-lime-voltage)" : "var(--color-fog)",
                border: "4px solid var(--color-paper)",
                boxShadow: isDone ? "0 0 0 1px var(--color-lime-voltage)" : "0 0 0 1px var(--color-fog)",
              }} />
              <div style={{
                fontFamily: "var(--font-inter)",
                fontSize: "12px",
                fontWeight: isCurrent ? 600 : 500,
                color: isCurrent ? "var(--color-obsidian)" : (isDone ? "var(--color-forest-ink)" : "var(--color-pebble)"),
                textAlign: "center",
              }}>
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
