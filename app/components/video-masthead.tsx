import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

export default function VideoMasthead({
  slug,
  initialVideo,
  image,
}: {
  slug: string;
  initialVideo: number;
  image: string;
}) {
  const [currentVideo, setCurrentVideo] = useState(initialVideo);
  const [rotationCount, setRotationCount] = useState(0);
  const [hasChanged, setHasChanged] = useState(false);

  const changeVideo = () => {
    setCurrentVideo(Math.floor(Math.random() * 21));
    setRotationCount((prev: number) => prev + 1);
    setHasChanged(true);
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
            "{image}"
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-2xs max-w-48">
            Generated with{" "}
            <a
              href="https://replicate.com/jakedahn/flux-latentpop"
              className="underline underline-offset-2"
            >
              flux-latentpop
            </a>{" "}
            and{" "}
            <a
              href="https://replicate.com/bytedance/seedance-1-pro-fast"
              className="underline underline-offset-2"
            >
              seedance-1-pro-fast
            </a>
            .
          </p>
        </div>
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
            {String(currentVideo).padStart(2, "0")}/{21}
          </span>
        </button>
      </div>
    </div>
  );
}
