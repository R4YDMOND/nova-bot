"use client";

export function Badge({ children, variant = "default", className = "" }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "danger" | "info"; className?: string }) {
  const variants: Record<string, string> = {
    default: "rgba(0,229,255,0.1)",
    success: "rgba(34,197,94,0.15)",
    warning: "rgba(245,158,11,0.15)",
    danger: "rgba(239,68,68,0.15)",
    info: "rgba(59,130,246,0.15)",
  };
  const colors: Record<string, string> = {
    default: "var(--accent)",
    success: "var(--success)",
    warning: "var(--warning)",
    danger: "var(--danger)",
    info: "var(--info)",
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: "var(--radius-sm)",
        fontSize: "var(--font-xs)",
        fontWeight: 500,
        background: variants[variant] || variants.default,
        color: colors[variant] || colors.default,
        border: `1px solid ${colors[variant]}30`,
      }}
      className={className}
    >
      {children}
    </span>
  );
}
