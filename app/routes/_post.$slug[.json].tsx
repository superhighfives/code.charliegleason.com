import { json } from "@remix-run/cloudflare";
import { getPosts } from "~/.server/posts";

export async function loader({ params }: { params: { slug: string } }) {
  const posts = await getPosts({ slug: params.slug });
  if (posts.length) {
    return json(posts[0]);
  } else {
    return json(null, { status: 404 });
  }
}
