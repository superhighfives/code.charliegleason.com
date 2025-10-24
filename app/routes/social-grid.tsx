import { useLoaderData } from "react-router";
import type { Route } from "./+types/social-grid";

export async function loader({ params }: Route.LoaderArgs) {
  const { slug } = params;
  return { slug };
}

export default function SocialGrid() {
  const { slug } = useLoaderData<typeof loader>();

  // Generate array of image indices (0-20)
  const imageIndices = Array.from({ length: 21 }, (_, i) => i);

  return (
    <div className="grid grid-cols-3 gap-4">
      {imageIndices.map((index) => {
        const imageUrl = `/${slug}.png?image=${index}`;

        return (
          <div key={index} className="card">
            <a href={`${imageUrl}`} target="_blank" rel="noopener noreferrer">
              <img src={imageUrl} alt="" loading="lazy" />
            </a>
          </div>
        );
      })}
    </div>
  );
}
