import { useRef } from "react";
import { useLoaderData } from "react-router";
import tags from "~/components/utils/tags";
import { loadMdxRuntime } from "~/mdx/mdx-runtime";
import type { Route } from "./+types/social-grid";

export async function loader({ request, params }: Route.LoaderArgs) {
  const requestUrl = request.url.replace("/social", "");
  const { frontmatter } = await loadMdxRuntime(requestUrl);
  const { slug } = params;
  return { slug, frontmatter };
}

export function meta({ data }: Route.MetaArgs) {
  if (!data) return tags();
  console.log(data);
  const { frontmatter } = data;
  return tags({
    ...frontmatter,
    title: `Social Grid for ${frontmatter.title}`,
  });
}

function VideoCard({
  imageUrl,
  videoUrl,
}: {
  imageUrl: string;
  videoUrl: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div className="card relative">
      <a
        className="group"
        href={`${imageUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          className="group-hover:opacity-25 transition-opacity"
        />
        <div className="absolute inset-0 z-10">
          <video
            ref={videoRef}
            src={videoUrl}
            muted
            loop
            className="p-4 size-full object-fit opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
      </a>
    </div>
  );
}

export default function SocialGrid() {
  const { slug } = useLoaderData<typeof loader>();

  // Generate array of image indices (0-20)
  const imageIndices = Array.from({ length: 21 }, (_, i) => i);

  return (
    <div className="grid grid-cols-3 gap-4">
      {imageIndices.map((index) => {
        // Convert internal index (0-20) to user-facing (1-21) for URLs
        const userIndex = index + 1;
        const imageUrl = `/${slug}/${userIndex}.png`;
        const videoUrl = `/posts/${slug}/${index}.mp4`;

        return (
          <VideoCard key={index} imageUrl={imageUrl} videoUrl={videoUrl} />
        );
      })}
    </div>
  );
}
