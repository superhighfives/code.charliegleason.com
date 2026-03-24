import { AnimatePresence, motion } from "framer-motion";
import { Check, RefreshCw, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

interface VisualConfig {
  prompt: string;
  image: {
    url: string;
    version: string;
    guidance?: string;
  };
  video?: {
    url: string;
    version: string;
  };
  colors?: Array<{ text: string; background: string }>;
}

function toUserIndex(index: number): number {
  return index + 1;
}

function randomVideoIndexExcluding(exclude: number, count: number): number {
  if (count <= 1) return 0;
  let newIndex: number;
  do {
    newIndex = Math.floor(Math.random() * count);
  } while (newIndex === exclude);
  return newIndex;
}

function extractModelName(url: string): string {
  const match = url.match(/replicate\.com\/[^/]+\/([^/?#]+)/);
  return match ? match[1] : url;
}

/**
 * Icon swap animation component using framer-motion
 */
function IconSwapAnimation({
  condition,
  children,
}: {
  condition: boolean;
  children: [React.ReactNode, React.ReactNode];
}) {
  const [trueIcon, falseIcon] = children;
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={condition ? "true" : "false"}
        initial={!animate ? false : { scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {condition ? trueIcon : falseIcon}
      </motion.div>
    </AnimatePresence>
  );
}

export default function VideoMasthead({
  slug,
  video: initialVideo,
  visual,
}: {
  slug: string;
  video: number;
  visual: VisualConfig;
}) {
  const visualCount = visual.colors?.length ?? 9;
  const [mounted, setMounted] = useState(false);

  const [currentVideo, setCurrentVideo] = useState(initialVideo);
  const [nextVideo, setNextVideo] = useState(() =>
    randomVideoIndexExcluding(initialVideo, visualCount),
  );
  const [rotationCount, setRotationCount] = useState(0);
  const [hasChanged, setHasChanged] = useState(false);
  const [copied, setCopied] = useState(false);

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Preload next video
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "video";
    link.href = `/posts/${slug}/${nextVideo}.mp4`;
    document.head.appendChild(link);
    return () => {
      link.remove();
    };
  }, [slug, nextVideo]);

  // SSR fallback - show static image when JS is disabled or not yet loaded
  if (!mounted) {
    return (
      <div className="font-mono relative -top-12 -mb-6 flex items-end flex-wrap xs:flex-nowrap gap-4 max-w-4xl">
        <div className="bg-gray-100 dark:bg-gray-900 w-full aspect-square xs:size-72 sm:size-96 shrink-0 relative overflow-hidden shadow-lg rounded-lg -rotate-1">
          <img
            src={`/posts/${slug}/${initialVideo}.png`}
            alt={visual.prompt}
            className="size-full object-cover"
            style={{ viewTransitionName: `post-visual-${slug}` }}
          />
        </div>
        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-gray-500 dark:text-gray-400 text-xs text-pretty max-w-72 leading-5">
              "{visual.prompt}"
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-2xs max-w-48 leading-4">
              Generated with{" "}
              <a
                href={visual.image.url}
                className="underline underline-offset-1 hover:text-gray-600 dark:hover:text-gray-300 outline-none focus-visible:text-gray-600 dark:focus-visible:text-gray-300 focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 rounded-sm decoration-clone"
                target="_blank"
                rel="noopener noreferrer"
              >
                {extractModelName(visual.image.url)}
              </a>
              {visual.video && (
                <>
                  {" and "}
                  <a
                    href={visual.video.url}
                    className="underline underline-offset-1 hover:text-gray-600 dark:hover:text-gray-300 outline-none focus-visible:text-gray-600 dark:focus-visible:text-gray-300 focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 rounded-sm decoration-clone"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {extractModelName(visual.video.url)}
                  </a>
                </>
              )}
              .
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="flex -mx-1 items-center gap-1.5 text-xs rounded-full px-2 py-0.5">
              <RefreshCw
                className="text-gray-500 dark:text-gray-400"
                size={12}
              />
              <span className="text-gray-400 dark:text-gray-500">
                {toUserIndex(initialVideo)}/{visualCount}
              </span>
            </span>
            <span className="flex -mx-1 items-center gap-1.5 text-xs rounded-full px-2 py-0.5">
              <Share2 className="text-gray-500 dark:text-gray-400" size={12} />
              <span className="text-gray-400 dark:text-gray-500">Share</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  const changeVideo = () => {
    setCurrentVideo(nextVideo);
    const newNextVideo = randomVideoIndexExcluding(nextVideo, visualCount);
    setNextVideo(newNextVideo);
    setRotationCount((prev) => prev + 1);
    setHasChanged(true);
  };

  const shareUrl = () => {
    const origin = window.location.origin;
    const url = `${origin}/${slug}/${toUserIndex(currentVideo)}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="font-mono relative -top-12 -mb-6 flex items-end flex-wrap xs:flex-nowrap gap-4 max-w-4xl">
      <div className="bg-gray-100 dark:bg-gray-900 w-full aspect-square xs:size-72 sm:size-96 shrink-0 relative overflow-hidden shadow-lg rounded-lg -rotate-1">
        <AnimatePresence mode="popLayout">
          <motion.video
            key={currentVideo}
            src={`/posts/${slug}/${currentVideo}.mp4`}
            autoPlay
            muted
            playsInline
            className="size-full"
            style={{ viewTransitionName: `post-visual-${slug}` }}
            initial={hasChanged ? { x: "100%" } : undefined}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.1 }}
          />
        </AnimatePresence>
      </div>
      <div className="space-y-3">
        <div className="space-y-2">
          <p className="text-gray-500 dark:text-gray-400 text-xs text-pretty max-w-72 leading-5">
            "{visual.prompt}"
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-2xs max-w-48 leading-4">
            Generated with{" "}
            <a
              href={visual.image.url}
              className="underline underline-offset-1 hover:text-gray-600 dark:hover:text-gray-300 outline-none focus-visible:text-gray-600 dark:focus-visible:text-gray-300 focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 rounded-sm decoration-clone"
              target="_blank"
              rel="noopener noreferrer"
            >
              {extractModelName(visual.image.url)}
            </a>
            {visual.video && (
              <>
                {" and "}
                <a
                  href={visual.video.url}
                  className="underline underline-offset-1 hover:text-gray-600 dark:hover:text-gray-300 outline-none focus-visible:text-gray-600 dark:focus-visible:text-gray-300 focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 rounded-sm decoration-clone"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {extractModelName(visual.video.url)}
                </a>
              </>
            )}
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
              {toUserIndex(currentVideo)}/{visualCount}
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
