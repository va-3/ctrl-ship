"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BuildWorkspace from "@/components/BuildWorkspace";

export default function WorkspacePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState<string | null>(null);
  const [quality, setQuality] = useState("build");
  const [model, setModel] = useState("anthropic/claude-sonnet-4-5");

  useEffect(() => {
    const storedPrompt = sessionStorage.getItem("buildPrompt");
    const storedQuality = sessionStorage.getItem("buildQuality") || "build";
    const storedModel = sessionStorage.getItem("buildModel") || "anthropic/claude-sonnet-4-5";
    const storedImage = sessionStorage.getItem("buildImage");

    if (!storedPrompt) {
      router.push("/");
      return;
    }

    // If an image was uploaded, append info to the prompt
    let finalPrompt = storedPrompt;
    if (storedImage) {
      // Store image for later use by the build workspace
      sessionStorage.setItem("buildImageData", storedImage);
      if (!storedPrompt.includes("screenshot") && !storedPrompt.includes("uploaded image")) {
        finalPrompt = `${storedPrompt}\n\n[User uploaded a reference image for this website]`;
      }
    }

    setPrompt(finalPrompt);
    setQuality(storedQuality);
    setModel(storedModel);

    sessionStorage.removeItem("buildPrompt");
    sessionStorage.removeItem("buildQuality");
    sessionStorage.removeItem("buildModel");
    sessionStorage.removeItem("buildImage");
  }, [router]);

  if (!prompt) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <BuildWorkspace
      initialPrompt={prompt}
      initialQuality={quality}
      initialModel={model}
    />
  );
}
