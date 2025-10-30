"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

export default function Command({
  highlightedHtml,
}: {
  highlightedHtml: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = highlightedHtml;
    const text = tempDiv.textContent || tempDiv.innerText || "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative border border-b-4 p-4 pr-16 rounded-xs bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-700 mt-4 break-words [&_pre_code]:whitespace-pre-wrap">
      <div
        // biome-ignore lint/security/noDangerouslySetInnerHtml: required by shiki
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-2.5 right-2.5 p-2 rounded-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:bg-gray-100 dark:focus-visible:bg-gray-800 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950"
        aria-label="Copy to clipboard"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={copied ? "check" : "copy"}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {copied ? (
              <Check size={16} className="text-green-500" />
            ) : (
              <Copy size={16} className="text-gray-500" />
            )}
          </motion.div>
        </AnimatePresence>
      </button>
    </div>
  );
}
