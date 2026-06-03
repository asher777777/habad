"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";

interface ShareButtonProps {
  title: string;
  summary: string;
}

export function ShareButton({ title, summary }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (typeof window === "undefined") return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: summary,
          url: window.location.href,
        });
      } catch (err) {
        console.warn("Share failed:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Clipboard copy failed:", err);
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className="bg-primary hover:bg-primary-hover text-white text-sm font-bold px-5 py-2.5 rounded-full flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
    >
      <Share2 className="w-4 h-4" />
      <span>{copied ? "הקישור הועתק!" : "שיתוף מהיר"}</span>
    </button>
  );
}
