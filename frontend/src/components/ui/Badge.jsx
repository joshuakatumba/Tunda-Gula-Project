export const Badge = ({ variant = "default", children, style, ...props }) => {
  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-inter)",
    fontWeight: 500,
    fontSize: "12px",
    borderRadius: "var(--radius-tags)",
    padding: "4px 12px",
    whiteSpace: "nowrap"
  };
  const variants = {
    default: {
      backgroundColor: "var(--color-fog)",
      color: "var(--color-charcoal)"
    },
    inverted: {
      backgroundColor: "var(--color-forest-ink)",
      color: "var(--color-lime-voltage)"
    },
    accent: {
      backgroundColor: "var(--color-linen-mist)",
      color: "var(--color-forest-ink)"
    }
  };
  return <span style={{ ...baseStyle, ...variants[variant], ...style }} {...props}>{children}</span>;
};
