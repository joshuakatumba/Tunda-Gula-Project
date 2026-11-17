export const Card = ({ variant = "paper", children, style, ...props }) => {
  const baseStyle = {};
  const variants = {
    paper: {
      backgroundColor: "var(--color-paper)",
      borderRadius: "var(--radius-cards)",
      padding: "24px",
      border: "1px solid var(--color-fog)",
      boxShadow: "var(--shadow-subtle)"
    },
    fog: {
      backgroundColor: "var(--color-fog)",
      borderRadius: "var(--radius-cards)",
      padding: "24px"
    },
    dark: {
      backgroundColor: "var(--color-forest-ink)",
      color: "var(--color-paper)",
      borderRadius: "var(--radius-largecards)",
      padding: "40px"
    }
  };
  return <div style={{ ...baseStyle, ...variants[variant], ...style }} {...props}>{children}</div>;
};
