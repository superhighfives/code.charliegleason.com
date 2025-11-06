import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "~/routes/resources/theme-switch";
import { toUserIndex } from "~/utils/video-index";

export default function NavBlock({
  title,
  href,
  description,
  slug,
  initialVideo,
  index = 0,
  tags,
}: {
  title: string;
  caption?: string | null;
  href: string;
  description?: string;
  slug: string;
  initialVideo: number;
  index?: number;
  tags?: string[];
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rewindAnimationRef = useRef<number | null>(null);
  const hasPlayedRef = useRef(false);

  // Touch device detection (hydration-safe)
  const [isTouchDevice, setIsTouchDevice] = useState<boolean | undefined>(
    undefined,
  );

  // Viewport intersection state (starts false to match SSR)
  const [isInViewport, setIsInViewport] = useState(false);
  const elementRef = useRef<HTMLAnchorElement>(null);
  const viewportDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const currentVideo = initialVideo;

  // Separate video active state - includes viewport for touch devices
  const isVideoActive =
    isHovered || isFocused || (isTouchDevice === true && isInViewport);
  const isVideoActiveRef = useRef(false);
  isVideoActiveRef.current = isVideoActive;

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  // Handle when video loads
  const handleVideoLoad = () => {
    const video = videoRef.current;
    if (!video) return;

    // If video should be active when it loads, play it
    // Otherwise pause it to ensure it starts in paused state
    if (isVideoActiveRef.current) {
      video.play().catch(() => {
        // Ignore autoplay errors
      });
    } else {
      video.pause();
    }
  };

  // Play/pause based on video active state (hover, focus, or viewport on touch)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Cancel any ongoing rewind animation
    if (rewindAnimationRef.current) {
      cancelAnimationFrame(rewindAnimationRef.current);
      rewindAnimationRef.current = null;
    }

    if (isVideoActive) {
      hasPlayedRef.current = false;
      video.play().catch(() => {
        // Ignore autoplay errors
      });
    } else {
      video.pause();
      // Rewind effect: animate backwards to first frame
      const startTime = video.currentTime;

      const rewindDuration = 1000; // milliseconds
      const startTimestamp = performance.now();

      const rewind = (currentTimestamp: number) => {
        const elapsed = currentTimestamp - startTimestamp;
        const progress = Math.min(elapsed / rewindDuration, 1);

        // Ease out for smoother motion
        const easeProgress = 1 - (1 - progress) ** (rewindDuration / 100);

        video.currentTime = startTime * (1 - easeProgress);

        if (progress < 1) {
          rewindAnimationRef.current = requestAnimationFrame(rewind);
        } else {
          rewindAnimationRef.current = null;
          hasPlayedRef.current = false;
        }
      };

      rewindAnimationRef.current = requestAnimationFrame(rewind);
    }

    // Cleanup function to cancel animation on unmount
    return () => {
      if (rewindAnimationRef.current) {
        cancelAnimationFrame(rewindAnimationRef.current);
        rewindAnimationRef.current = null;
      }
    };
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
          // Clear any pending debounce
          if (viewportDebounceRef.current) {
            clearTimeout(viewportDebounceRef.current);
          }

          if (entry.isIntersecting) {
            // Immediately set to true when entering viewport (no debounce)
            // This ensures videos start playing right away
            setIsInViewport(true);
          } else {
            // Debounce setting to false to prevent rewind thrashing during scroll
            viewportDebounceRef.current = setTimeout(() => {
              setIsInViewport(false);
            }, 100);
          }
        });
      },
      {
        // Lower threshold to trigger earlier and prevent initial play issue
        threshold: 0.25,
        // Remove bottom margin to prevent boundary flickering
        rootMargin: "0px 0px 0px 0px",
      },
    );

    observer.observe(elementRef.current);

    return () => {
      observer.disconnect();
      // Clean up any pending debounce on unmount
      if (viewportDebounceRef.current) {
        clearTimeout(viewportDebounceRef.current);
      }
    };
  }, [isTouchDevice]);

  const handleVideoEnded = () => {
    // Video will stop on last frame naturally
    // No need to do anything here
  };

  const handleVideoPlaying = () => {
    // Mark that video has actually started playing
    hasPlayedRef.current = true;
  };

  const firstItem = index === 0;

  const theme = useTheme();
  const activeFilter =
    "grayscale(0) hue-rotate(360deg) contrast(1) brightness(1)";
  const inactiveFilter =
    theme === "dark"
      ? "grayscale(1) hue-rotate(200deg) contrast(1.25) brightness(0.5) opacity(0.5)"
      : "grayscale(1) hue-rotate(200deg) contrast(1.25) brightness(1.2) opacity(0.5)";

  return (
    <a
      ref={elementRef}
      href={`${href}/${toUserIndex(currentVideo)}`}
      className={`overflow-hidden p-2 flex flex-col xs:flex-row group lg:border border border-gray-200 dark:border-gray-900 rounded-md hover:bg-gray-50 focus:bg-gray-50 dark:hover:bg-gray-900 dark:focus:bg-gray-900 relative before:content-[''] before:rounded-r-sm before:absolute before:left-0 before:top-0 before:h-full before:w-[2px] before:bg-transparent hover:before:bg-indigo-500 focus:before:bg-indigo-500 before:z-10 gap-2 outline-none focus-visible:ring-0 ${firstItem ? "lg:col-span-2" : ""}`}
      rel="noreferrer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {/* Video container */}
      <div className="relative w-full xs:size-48 aspect-square shrink-0 overflow-hidden rounded-md xs:ml-[3px]">
        <motion.video
          ref={videoRef}
          src={`/posts/${slug}/${currentVideo}.mp4`}
          muted
          playsInline
          preload="auto"
          loop={false}
          onEnded={handleVideoEnded}
          onLoadedData={handleVideoLoad}
          onPlaying={handleVideoPlaying}
          className="size-full object-cover"
          initial={{
            filter: inactiveFilter,
          }}
          animate={{
            filter: isVideoActive ? activeFilter : inactiveFilter,
          }}
          transition={{
            duration: 0.3,
            // Add staggered delay for cascade effect on touch devices
            delay: isTouchDevice && isInViewport ? index * 0.05 : 0,
          }}
        />
      </div>

      <div className="@container flex flex-col gap-4 justify-between px-4 py-3 flex-1">
        <div className="space-y-2">
          <div className="flex justify-between relative z-10">
            <div
              className={`max-w-lg flex w-0 flex-1 flex-col @md:flex-row items-start @md:justify-between flex-wrap @lg:flex-nowrap gap-x-2 ${description ? "gap-y-2" : "gap-y-0"}`}
            >
              <span className="dark:text-gray-200 text-pretty space-x-2 flex flex-col items-start xs:inline">
                <span
                  className={`pb-2 xs:pb-0 inline-block xs:inline font-semibold text-lg sm:text-base ${firstItem ? "text-indigo-700 dark:text-indigo-300" : ""}`}
                >
                  {title}
                </span>
              </span>
            </div>
            <div className="ml-4 shrink-0">
              <span className="mt-1 font-semibold text-indigo-600 group-hover:text-indigo-700 group-focus:text-indigo-700 dark:text-indigo-400 dark:group-hover:text-indigo-300 dark:group-focus:text-indigo-300 flex gap-1 items-center">
                <span className="@max-lg:hidden text-xs">View</span>
                <span className="leading-none -mt-px">❯</span>
              </span>
            </div>
          </div>
          {description ? (
            <div className="relative z-10">
              <div className="overflow-hidden text-gray-400 dark:text-gray-500 text-sm max-w-lg">
                {description}
              </div>
            </div>
          ) : null}
        </div>
        {tags && tags.length > 0 ? (
          <div className="relative z-10 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-block shrink-0 text-gray-400 dark:text-gray-500 text-xs font-sans border px-2 py-0.5 rounded-full border-gray-200 dark:border-gray-700"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </a>
  );
}
