import React, { useState, useEffect } from "react";
import { Package } from "lucide-react";
import { resolveMediaUrl } from "../utils/media";

interface ThumbProps {
  src?: string | null;
  alt: string;
  size?: number | string;
  fallback?: React.ReactNode;
  className?: string;
}

export const Thumb: React.FC<ThumbProps> = ({ src, alt, size = 48, fallback = <Package size="50%" />, className = "" }) => {
  const [error, setError] = useState(false);
  const resolvedSrc = resolveMediaUrl(src);

  useEffect(() => {
    setError(false);
  }, [src]);

  if (!resolvedSrc || error) {
    return (
      <div 
        className={className}
        style={{ 
          width: size, 
          height: size, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          backgroundColor: "var(--color-fog)",
          borderRadius: "var(--radius-cards)",
          fontSize: typeof size === "number" ? size * 0.4 : "1rem",
          flexShrink: 0
        }}
        title={alt}
      >
        {fallback}
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setError(true)}
      style={{
        width: size,
        height: size,
        objectFit: "cover",
        borderRadius: "var(--radius-cards)",
        flexShrink: 0
      }}
    />
  );
};
