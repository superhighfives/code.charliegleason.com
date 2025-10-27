import { AnimatePresence, motion } from "framer-motion";
import { Check, RefreshCw, Share2 } from "lucide-react";
import { useState } from "react";
import type { VisualConfig } from "~/mdx/types";
import {
  randomVideoIndex,
  toUserIndex,
  VIDEO_COUNT,
} from "~/utils/video-index";

/**
 * Extracts the model name from a Replicate URL
 * @param url - Replicate model URL (e.g. "https://replicate.com/jakedahn/flux-latentpop")
 * @returns Model name (e.g. "flux-latentpop")
 */
function extractModelName(url: string): string {
  const match = url.match(/replicate\.com\/[^/]+\/([^/?#]+)/);
  if (!match) {
    throw new Error(`Invalid Replicate URL format: ${url}`);
  }
  return match[1];
}

export default function VideoMasthead({
  slug,
  initialVideo,
  visual,
}: {
  slug: string;
  initialVideo: number;
  visual: VisualConfig;
}) {
  const [currentVideo, setCurrentVideo] = useState(initialVideo);
  const [rotationCount, setRotationCount] = useState(0);
  const [hasChanged, setHasChanged] = useState(false);
  const [copied, setCopied] = useState(false);

  const changeVideo = () => {
    setCurrentVideo(randomVideoIndex());
    setRotationCount((prev: number) => prev + 1);
    setHasChanged(true);
  };

  const shareUrl = () => {
    const url = new URL(window.location.href);
    // Convert internal index (0-20) to user-facing (1-21)
    url.searchParams.set("image", toUserIndex(currentVideo).toString());
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative -top-12 -mb-6 flex items-end flex-wrap xs:flex-nowrap gap-4 max-w-[65ch]">
      <div className="bg-gray-100 dark:bg-gray-900 w-full aspect-square xs:size-72 sm:size-96 shrink-0 relative overflow-hidden shadow-lg rounded-lg -rotate-1">
        <AnimatePresence mode="popLayout">
          <motion.video
            key={currentVideo}
            src={`/posts/${slug}/${currentVideo}.mp4`}
            autoPlay
            muted
            playsInline
            className="size-full"
            initial={hasChanged ? { x: "100%" } : false}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.1 }}
          />
        </AnimatePresence>
      </div>
      <div className="space-y-3">
        <div className="space-y-2">
          <p className="text-gray-500 dark:text-gray-400 text-xs text-pretty">
            "{visual.prompt}"
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-2xs max-w-48">
            Generated with{" "}
            <a
              href={visual.image.url}
              className="underline underline-offset-2"
            >
              {extractModelName(visual.image.url)}
            </a>
            {" and "}
            <a
              href={visual.video.url}
              className="underline underline-offset-2"
            >
              {extractModelName(visual.video.url)}
            </a>
            .
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={changeVideo}
            className="flex -mx-1 hover:cursor-pointer items-center gap-1.5 text-2xs rounded-full px-2 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <motion.div
              animate={{ rotate: rotationCount * 180 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <RefreshCw
                className="text-gray-500 dark:text-gray-400"
                size={12}
                fontWeight="light"
              />
            </motion.div>

            <span className="text-gray-400 dark:text-gray-500">
              {String(toUserIndex(currentVideo)).padStart(2, "0")}/{VIDEO_COUNT}
            </span>
          </button>
          <button
            type="button"
            onClick={shareUrl}
            className="flex -mx-1 hover:cursor-pointer items-center gap-1.5 text-2xs rounded-full px-2 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={copied ? "check" : "share"}
                initial={hasChanged ? { scale: 0.8, opacity: 0 } : false}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {copied ? (
                  <Check
                    className="text-gray-500 dark:text-gray-400"
                    size={12}
                    fontWeight="light"
                  />
                ) : (
                  <Share2
                    className="text-gray-500 dark:text-gray-400"
                    size={12}
                    fontWeight="light"
                  />
                )}
              </motion.div>
            </AnimatePresence>

            <span className="text-gray-400 dark:text-gray-500">
              {copied ? "Copied!" : "Share"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
