import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: string;
  variant?: "default" | "inverted" | "accent";
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ tone = "default", variant, children, style, ...props }) => {
  // Map tone or variant
  let bg = "var(--color-fog)";
  let color = "var(--color-charcoal)";

  if (variant === "inverted" || tone === "inverted") {
    bg = "var(--color-obsidian)";
    color = "var(--color-paper)";
  } else if (variant === "accent" || tone === "b-green" || tone === "accent") {
    bg = "var(--color-fog)";
    color = "var(--color-obsidian)";
  } else if (tone === "b-maize") {
    bg = "var(--color-fog)";
    color = "var(--color-obsidian)";
  } else if (tone === "b-red") {
    bg = "#FCE8E8";
    color = "var(--color-alarm-red)";
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-inter)",
        fontWeight: 500,
        fontSize: "var(--fs-caption)",
        borderRadius: "var(--radius-tags)",
        padding: "4px 12px",
        whiteSpace: "nowrap",
        backgroundColor: bg,
        color: color,
        lineHeight: "1.4",
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
};
