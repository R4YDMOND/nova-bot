"use client";

export function Card({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{
        background: "var(--bg-card)",
        borderRadius: "var(--radius-xl)",
        padding: 20,
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-md)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
