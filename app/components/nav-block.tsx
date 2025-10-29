import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export default function NavBlock({
  title,
  caption,
  href,
  description,
  slug,
  initialVideo,
}: {
  title: string;
  caption?: string | null;
  href: string;
  description?: string;
  slug: string;
  initialVideo: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [videoKey, setVideoKey] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasChanged, setHasChanged] = useState(false);
  const readyVideoRef = useRef<HTMLVideoElement | null>(null);
  const isHoveredRef = useRef(false);
  const hasEnteredRef = useRef(false);

  const [currentVideo, setCurrentVideo] = useState(initialVideo);

  const handleMouseEnter = () => {
    // Only set hover state if not already hovered to prevent multiple fires
    if (!isHovered) {
      setHasChanged(true);
      setIsHovered(true);
      isHoveredRef.current = true;
      hasEnteredRef.current = true;
    }
  };

  const handleMouseMove = () => {
    // Detect if mouse is already over element on page load
    // This triggers hover state even if onMouseEnter didn't fire
    if (!hasEnteredRef.current) {
      setHasChanged(true);
      setIsHovered(true);
      isHoveredRef.current = true;
      hasEnteredRef.current = true;
    }
  };

  const handleMouseLeave = () => {
    // Only change video if we've actually entered before
    // This prevents the weird animation when page loads with mouse already over element
    if (hasEnteredRef.current) {
      const randomVideo = Math.floor(Math.random() * 21);
      setCurrentVideo(randomVideo);
      setVideoKey((prev) => prev + 1);

      // Update cookie when video changes (on mouse leave only)
      // biome-ignore lint/suspicious/noDocumentCookie: Client-side cookie setting for video index persistence
      document.cookie = `visual-index-${slug}=${randomVideo}; path=/; samesite=lax`;
    }

    setIsHovered(false);
    isHoveredRef.current = false;
    readyVideoRef.current = null;
  };

  // Handle when video loads
  const handleVideoLoad = () => {
    const video = videoRef.current;
    if (!video) return;

    // Always ensure video is paused when it loads
    video.pause();
    video.currentTime = 0;
  };

  // Called when video animation completes (slide in finishes)
  // Store the video element ref when it's fully ready
  const handleAnimationComplete = () => {
    const video = videoRef.current;
    if (!video) return;

    readyVideoRef.current = video;

    // Use ref instead of state to get current hover status
    if (isHoveredRef.current) {
      video.currentTime = 0;
      video.play().catch(() => {
        // Ignore autoplay errors
      });
    } else {
      // Ensure video is paused if not hovered
      video.pause();
      video.currentTime = 0;
    }
  };

  // Play/pause based on hover state
  useEffect(() => {
    const video = readyVideoRef.current;
    if (!video) return;

    if (isHovered) {
      video.currentTime = 0;
      video.play().catch(() => {
        // Ignore autoplay errors
      });
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isHovered]);

  const handleVideoEnded = () => {
    // Video will stop on last frame naturally
    // No need to do anything here
  };

  const handleClick = () => {
    // Set a short-lived navigation cookie to indicate we're navigating from index
    // This cookie expires in 2 seconds (just enough time for navigation)
    // biome-ignore lint/suspicious/noDocumentCookie: Client-side cookie setting for navigation tracking
    document.cookie = `nav-from-index-${slug}=1; path=/; max-age=2; samesite=lax`;
  };

  // Link to post without image index (cookie will handle persistence)
  const linkHref = href;

  return (
    <a
      href={linkHref}
      className="flex flex-col xs:flex-row group hover:bg-gray-50 dark:hover:bg-gray-900 relative before:content-[''] before:rounded-r-sm before:absolute before:left-0 before:top-0 before:h-full before:w-[2px] before:bg-transparent hover:before:bg-indigo-500 before:z-10 gap-2"
      rel="noreferrer"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Video container */}
      <div className="relative w-full xs:size-32 aspect-square shrink-0 overflow-hidden rounded-md ml-[3px]">
        <AnimatePresence mode="popLayout">
          <motion.video
            key={videoKey}
            ref={videoRef}
            src={`/posts/${slug}/${currentVideo}.mp4`}
            muted
            playsInline
            loop={false}
            onEnded={handleVideoEnded}
            onLoadedData={handleVideoLoad}
            onAnimationComplete={handleAnimationComplete}
            className="size-full object-cover"
            style={{
              filter: isHovered ? "grayscale(0%)" : "grayscale(100%)",
            }}
            initial={hasChanged ? { x: "100%" } : false}
            animate={{
              opacity: isHovered ? 1 : 0.25,
              filter: isHovered ? "grayscale(0%)" : "grayscale(75%)",
              x: 0,
            }}
            exit={hasChanged ? { x: "-100%" } : undefined}
            transition={{ duration: 0.3 }}
          />
        </AnimatePresence>
      </div>

      <div className="@container flex flex-col gap-2 px-4 py-3 flex-1">
        <div className="flex justify-between leading-6 relative z-10">
          <div
            className={`flex w-0 flex-1 flex-col @md:flex-row items-start @md:justify-between flex-wrap @lg:flex-nowrap gap-x-2 ${description ? "gap-y-2" : "gap-y-0"}`}
          >
            <span className="font-medium dark:text-gray-200 leading-5 text-pretty space-x-2">
              <span className="pb-2 xs:pb-0 inline-block xs:inline">
                {title}
              </span>
              {caption ? (
                <span className="inline-block shrink-0 text-gray-400 dark:text-gray-500 text-xs font-sans border px-2 rounded-full border-gray-200 dark:border-gray-700">
                  {caption}
                </span>
              ) : null}
            </span>
          </div>
          <div className="ml-4 shrink-0">
            <span className="mt-1 font-medium text-indigo-600 group-hover:text-indigo-700 dark:text-indigo-400 dark:group-hover:text-indigo-300 flex gap-1 items-center">
              <span className="@max-lg:hidden text-xs">View</span>
              <span className="leading-none -mt-px">❯</span>
            </span>
          </div>
        </div>
        {description ? (
          <div className="text-xs leading-5 relative z-10">
            <div className="overflow-hidden line-clamp-2 text-gray-400 dark:text-gray-500 leading-5">
              {description}
            </div>
          </div>
        ) : null}
      </div>
    </a>
  );
}
