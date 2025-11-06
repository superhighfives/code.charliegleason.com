import { AnimatePresence, motion } from "framer-motion";
import { Check, RefreshCw, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { VisualConfig } from "~/mdx/types";
import { extractModelName } from "~/utils/replicate";
import {
  preloadVideo,
  randomVideoIndexExcluding,
  toUserIndex,
  VISUAL_COUNT,
} from "~/utils/video-index";
import IconSwapAnimation from "./icon-swap-animation";

export default function VideoMasthead({
  slug,
  initialVideo,
  nextVideo: initialNextVideo,
  visual,
}: {
  slug: string;
  initialVideo: number;
  nextVideo: number;
  visual: VisualConfig;
}) {
  const [currentVideo, setCurrentVideo] = useState(initialVideo);
  const [nextVideo, setNextVideo] = useState(initialNextVideo);
  const [rotationCount, setRotationCount] = useState(0);
  const [hasChanged, setHasChanged] = useState(false);
  const [copied, setCopied] = useState(false);

  // Preload current and next video on mount and when they change
  useEffect(() => {
    preloadVideo(slug, currentVideo);
    preloadVideo(slug, nextVideo);
  }, [slug, currentVideo, nextVideo]);

  const changeVideo = () => {
    // Show the pre-decided next video
    setCurrentVideo(nextVideo);
    // Generate and preload the new next video
    const newNextVideo = randomVideoIndexExcluding(nextVideo);
    setNextVideo(newNextVideo);
    setRotationCount((prev: number) => prev + 1);
    setHasChanged(true);
  };

  const shareUrl = () => {
    // Build URL with current video index
    const origin = window.location.origin;
    const url = `${origin}/${slug}/${toUserIndex(currentVideo)}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative -top-12 -mb-6 flex items-end flex-wrap xs:flex-nowrap gap-4 max-w-xl">
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
          <p className="text-gray-500 dark:text-gray-400 text-xs text-pretty leading-5">
            "{visual.prompt}"
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-2xs max-w-48 leading-4">
            Generated with{" "}
            <a
              href={visual.image.url}
              className="underline underline-offset-1 hover:text-gray-600 dark:hover:text-gray-300 outline-none focus:text-gray-600 dark:focus:text-gray-300 focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 rounded-sm decoration-clone"
            >
              {extractModelName(visual.image.url)}
            </a>
            {" and "}
            <a
              href={visual.video.url}
              className="underline underline-offset-1  hover:text-gray-600 dark:hover:text-gray-300 outline-none focus:text-gray-600 dark:focus:text-gray-300 focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 rounded-sm decoration-clone"
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
            className="flex -mx-1 hover:cursor-pointer items-center gap-1.5 text-xs rounded-full px-2 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:bg-gray-100 dark:focus-visible:bg-gray-800 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950"
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
              {toUserIndex(currentVideo)}/{VISUAL_COUNT}
            </span>
          </button>
          <button
            type="button"
            onClick={shareUrl}
            className="flex -mx-1 hover:cursor-pointer items-center gap-1.5 text-xs rounded-full px-2 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:bg-gray-100 dark:focus-visible:bg-gray-800 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950"
          >
            <IconSwapAnimation condition={copied}>
              <Check
                className="text-gray-500 dark:text-gray-400"
                size={12}
                fontWeight="light"
              />
              <Share2
                className="text-gray-500 dark:text-gray-400"
                size={12}
                fontWeight="light"
              />
            </IconSwapAnimation>

            <span className="text-gray-400 dark:text-gray-500">
              {copied ? "Copied!" : "Share"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
