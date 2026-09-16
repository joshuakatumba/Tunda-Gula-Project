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
    bg = "var(--color-forest-ink)";
    color = "var(--color-lime-voltage)";
  } else if (variant === "accent" || tone === "b-green" || tone === "accent") {
    bg = "var(--color-linen-mist)";
    color = "var(--color-forest-ink)";
  } else if (tone === "b-maize") {
    bg = "var(--color-lime-voltage)";
    color = "var(--color-forest-ink)";
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
        fontSize: "12px",
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
