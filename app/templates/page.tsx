"use client";

import { useRouter } from "next/navigation";
import TemplateGrid from "@/components/TemplateGrid";

export default function TemplatesPage() {
  const router = useRouter();

  const handleSelect = (prompt: string) => {
    sessionStorage.setItem("buildPrompt", prompt);
    sessionStorage.setItem("buildQuality", "balanced");
    sessionStorage.setItem("buildModel", "anthropic/claude-sonnet-4-5");
    router.push("/workspace");
  };

  return (
    <div className="min-h-[calc(100vh-52px)]" style={{ background: "var(--bg)" }}>
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
        <TemplateGrid onSelectTemplate={handleSelect} />
      </div>
    </div>
  );
}
