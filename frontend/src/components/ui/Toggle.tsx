"use client";

export function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 44,
        height: 26,
        background: checked ? "var(--accent)" : "var(--border)",
        borderRadius: 26,
        cursor: "pointer",
        position: "relative",
        transition: "all var(--transition-base) ease",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          height: 20,
          width: 20,
          left: checked ? 22 : 4,
          top: 3,
          background: checked ? "#000" : "#FFF",
          borderRadius: "50%",
          transition: "all var(--transition-base) ease",
        }}
      />
    </div>
  );
}
