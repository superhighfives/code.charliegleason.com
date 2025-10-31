import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { randomVideoIndexExcluding, toUserIndex } from "~/utils/video-index";

export default function NavBlock({
  title,
  caption,
  href,
  description,
  slug,
  initialVideo,
  index = 0,
}: {
  title: string;
  caption?: string | null;
  href: string;
  description?: string;
  slug: string;
  initialVideo: number;
  index?: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [videoKey, setVideoKey] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasChanged, setHasChanged] = useState(false);
  const readyVideoRef = useRef<HTMLVideoElement | null>(null);
  const isHoveredRef = useRef(false);
  const isFocusedRef = useRef(false);
  const hasEnteredRef = useRef(false);

  // Touch device detection (hydration-safe)
  const [isTouchDevice, setIsTouchDevice] = useState<boolean | undefined>(
    undefined,
  );

  // Viewport intersection state (starts false to match SSR)
  const [isInViewport, setIsInViewport] = useState(false);
  const elementRef = useRef<HTMLAnchorElement>(null);

  const [currentVideo, setCurrentVideo] = useState(initialVideo);
  const [nextVideo, setNextVideo] = useState<number | null>(null);

  // Separate video active state - includes viewport for touch devices
  const isVideoActive =
    isHovered || isFocused || (isTouchDevice === true && isInViewport);
  const isVideoActiveRef = useRef(false);
  isVideoActiveRef.current = isVideoActive;

  const handleMouseEnter = () => {
    // Only set hover state if not already hovered to prevent multiple fires
    if (!isHovered) {
      setHasChanged(true);
      setIsHovered(true);
      isHoveredRef.current = true;
      hasEnteredRef.current = true;

      // Pre-select and preload the next video for smooth transition
      const upcomingVideo = randomVideoIndexExcluding(currentVideo);
      setNextVideo(upcomingVideo);

      // Create a hidden video element to preload (more reliable than link preload for videos)
      const video = document.createElement("video");
      video.preload = "auto";
      video.src = `/posts/${slug}/${upcomingVideo}.mp4`;
      video.style.display = "none";
      video.id = `preload-${slug}-${upcomingVideo}`;
      document.body.appendChild(video);
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
    // Only change video if we've actually entered before and nothing else is active
    // This prevents the weird animation when page loads with mouse already over element
    if (hasEnteredRef.current && !isFocusedRef.current && nextVideo !== null) {
      // Use the preloaded video instead of generating a new random one
      setCurrentVideo(nextVideo);
      setVideoKey((prev) => prev + 1);

      // Clean up preload video element
      const preloadVideo = document.getElementById(
        `preload-${slug}-${nextVideo}`,
      );
      if (preloadVideo) {
        preloadVideo.remove();
      }

      // Reset for next interaction
      setNextVideo(null);
    }

    setIsHovered(false);
    isHoveredRef.current = false;
    if (!isFocusedRef.current) {
      readyVideoRef.current = null;
    }
  };

  const handleFocus = () => {
    // Set focus state similar to hover
    if (!isFocused) {
      setHasChanged(true);
      setIsFocused(true);
      isFocusedRef.current = true;
      hasEnteredRef.current = true;

      // Pre-select and preload the next video for smooth transition
      const upcomingVideo = randomVideoIndexExcluding(currentVideo);
      setNextVideo(upcomingVideo);

      // Create a hidden video element to preload
      const video = document.createElement("video");
      video.preload = "auto";
      video.src = `/posts/${slug}/${upcomingVideo}.mp4`;
      video.style.display = "none";
      video.id = `preload-${slug}-${upcomingVideo}`;
      document.body.appendChild(video);
    }
  };

  const handleBlur = () => {
    // Only change video if we've actually entered before and nothing else is active
    if (hasEnteredRef.current && !isHoveredRef.current && nextVideo !== null) {
      // Use the preloaded video instead of generating a new random one
      setCurrentVideo(nextVideo);
      setVideoKey((prev) => prev + 1);

      // Clean up preload video element
      const preloadVideo = document.getElementById(
        `preload-${slug}-${nextVideo}`,
      );
      if (preloadVideo) {
        preloadVideo.remove();
      }

      // Reset for next interaction
      setNextVideo(null);
    }

    setIsFocused(false);
    isFocusedRef.current = false;
    if (!isHoveredRef.current) {
      readyVideoRef.current = null;
    }
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

    // Use ref instead of state to get current video active status (hover, focus, or viewport)
    if (isVideoActiveRef.current) {
      video.currentTime = 0;
      video.play().catch(() => {
        // Ignore autoplay errors
      });
    } else {
      // Ensure video is paused if not active
      video.pause();
      video.currentTime = 0;
    }
  };

  // Play/pause based on video active state (hover, focus, or viewport on touch)
  useEffect(() => {
    const video = readyVideoRef.current;
    if (!video) return;

    if (isVideoActive) {
      video.currentTime = 0;
      video.play().catch(() => {
        // Ignore autoplay errors
      });
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isVideoActive]);

  // Detect touch device (client-side only, hydration-safe)
  useEffect(() => {
    // Check if device supports hover (desktop) or is touch-based
    const hasHover = window.matchMedia("(hover: hover)").matches;
    const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    // Device is considered "touch" if it doesn't support hover well or has touch
    setIsTouchDevice(!hasHover || hasTouch);
  }, []);

  // IntersectionObserver for viewport detection (client-side only, hydration-safe)
  useEffect(() => {
    // Only set up observer on touch devices
    if (isTouchDevice !== true || !elementRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInViewport(entry.isIntersecting);
        });
      },
      {
        // Trigger when 50% of the element is visible
        threshold: 0.5,
        // Add some margin to trigger slightly before/after entering viewport
        rootMargin: "0px 0px -80px 0px",
      },
    );

    observer.observe(elementRef.current);

    return () => {
      observer.disconnect();
    };
  }, [isTouchDevice]);

  const handleVideoEnded = () => {
    // Video will stop on last frame naturally
    // No need to do anything here
  };

  return (
    <a
      ref={elementRef}
      href={`${href}/${toUserIndex(currentVideo)}`}
      className="p-2 flex flex-col xs:flex-row group hover:bg-gray-50 focus:bg-gray-50 dark:hover:bg-gray-900 dark:focus:bg-gray-900 relative before:content-[''] before:rounded-r-sm before:absolute before:left-0 before:top-0 before:h-full before:w-[2px] before:bg-transparent hover:before:bg-indigo-500 focus:before:bg-indigo-500 before:z-10 gap-2 outline-none focus-visible:ring-0"
      rel="noreferrer"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
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
              filter: isVideoActive ? "grayscale(0%)" : "grayscale(100%)",
            }}
            initial={hasChanged ? { x: "100%" } : false}
            animate={{
              filter: isVideoActive
                ? "sepia(0) hue-rotate(360deg) contrast(1) brightness(1)"
                : "sepia(1) hue-rotate(200deg) contrast(1.25) brightness(0.2)",
              x: 0,
            }}
            exit={hasChanged ? { x: "-100%" } : undefined}
            transition={{
              duration: 0.3,
              // Add staggered delay for cascade effect on touch devices
              delay: isTouchDevice && isInViewport ? index * 0.05 : 0,
            }}
          />
        </AnimatePresence>
      </div>

      <div className="@container flex flex-col gap-2 px-4 py-3 flex-1">
        <div className="flex justify-between leading-6 relative z-10">
          <div
            className={`flex w-0 flex-1 flex-col @md:flex-row items-start @md:justify-between flex-wrap @lg:flex-nowrap gap-x-2 ${description ? "gap-y-2" : "gap-y-0"}`}
          >
            <span className="font-medium dark:text-gray-200 text-pretty space-x-2">
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
            <span className="mt-1 font-medium text-indigo-600 group-hover:text-indigo-700 group-focus:text-indigo-700 dark:text-indigo-400 dark:group-hover:text-indigo-300 dark:group-focus:text-indigo-300 flex gap-1 items-center">
              <span className="@max-lg:hidden text-xs">View</span>
              <span className="leading-none -mt-px">❯</span>
            </span>
          </div>
        </div>
        {description ? (
          <div className="text-xs leading-5 relative z-10">
            <div className="overflow-hidden text-gray-400 dark:text-gray-500 leading-5">
              {description}
            </div>
          </div>
        ) : null}
      </div>
    </a>
  );
}
