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
