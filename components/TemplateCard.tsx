"use client";

interface TemplateCardProps {
  title: string;
  description: string;
  gradient: string;
  features: string[];
  pattern?: "default" | "dashboard" | "cards" | "chat" | "grid";
  onClick: () => void;
}

function FauxUI({ pattern = "default" }: { pattern?: string }) {
  switch (pattern) {
    case "dashboard":
      return (
        <>
          <div className="flex gap-1.5 mb-2">
            <div className="h-8 flex-1 bg-white/15 rounded" />
            <div className="h-8 flex-1 bg-white/10 rounded" />
            <div className="h-8 flex-1 bg-white/12 rounded" />
          </div>
          <div className="h-12 bg-white/10 rounded mb-1.5" />
          <div className="flex gap-1.5">
            <div className="h-6 flex-1 bg-white/8 rounded" />
            <div className="h-6 flex-1 bg-white/6 rounded" />
          </div>
        </>
      );
    case "cards":
      return (
        <div className="grid grid-cols-3 gap-1.5">
          {[0.18, 0.12, 0.15, 0.10, 0.14, 0.11].map((op, i) => (
            <div key={i} className="h-8 rounded" style={{ background: `rgba(255,255,255,${op})` }} />
          ))}
        </div>
      );
    case "chat":
      return (
        <div className="space-y-1.5">
          <div className="flex justify-end"><div className="h-4 w-2/3 bg-white/20 rounded-full" /></div>
          <div className="flex justify-start"><div className="h-4 w-1/2 bg-white/12 rounded-full" /></div>
          <div className="flex justify-end"><div className="h-4 w-3/5 bg-white/18 rounded-full" /></div>
          <div className="flex justify-start"><div className="h-4 w-2/5 bg-white/10 rounded-full" /></div>
        </div>
      );
    case "grid":
      return (
        <div className="space-y-1.5">
          <div className="h-10 bg-white/15 rounded" />
          <div className="grid grid-cols-2 gap-1.5">
            <div className="h-6 bg-white/10 rounded" />
            <div className="h-6 bg-white/12 rounded" />
          </div>
          <div className="h-3 bg-white/8 rounded-full w-3/4" />
        </div>
      );
    default:
      return (
        <div className="space-y-1.5">
          <div className="h-2.5 bg-white/20 rounded-full w-3/4" />
          <div className="h-2.5 bg-white/15 rounded-full w-1/2" />
          <div className="h-2.5 bg-white/10 rounded-full w-2/3" />
          <div className="flex gap-1.5 mt-3">
            <div className="h-5 bg-white/15 rounded w-14" />
            <div className="h-5 bg-white/10 rounded w-10" />
          </div>
        </div>
      );
  }
}

export default function TemplateCard({
  title,
  description,
  gradient,
  features,
  pattern = "default",
  onClick,
}: TemplateCardProps) {
  return (
    <button
      onClick={onClick}
      className="group text-left rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        boxShadow: "var(--shadow-sm)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Preview */}
      <div
        className="relative h-[140px] w-full overflow-hidden"
        style={{ background: gradient }}
      >
        <div className="absolute inset-3 bg-black/25 backdrop-blur-sm rounded-lg border border-white/10 p-3">
          {/* Browser dots */}
          <div className="flex items-center gap-1.5 mb-2.5">
            <div className="w-[7px] h-[7px] rounded-full bg-[#ff5f57]" />
            <div className="w-[7px] h-[7px] rounded-full bg-[#ffbd2e]" />
            <div className="w-[7px] h-[7px] rounded-full bg-[#28c840]" />
          </div>
          <FauxUI pattern={pattern} />
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-300 flex items-center justify-center">
          <span className="text-white text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20">
            Use template →
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5" style={{ background: "var(--bg-secondary)" }}>
        <h3
          className="text-[13px] font-semibold mb-0.5 transition-colors"
          style={{ color: "var(--text)" }}
        >
          {title}
        </h3>
        <p className="text-[11px] leading-relaxed line-clamp-1" style={{ color: "var(--text-muted)" }}>
          {description}
        </p>
      </div>
    </button>
  );
}
