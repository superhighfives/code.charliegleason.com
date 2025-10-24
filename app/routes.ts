import { index, type RouteConfig, route } from "@react-router/dev/routes";
import { routes } from "./mdx/mdx-routes";

export default [
  index("routes/index.tsx"),
  route("theme-switch", "routes/resources/theme-switch.tsx"),
  route("kudos", "routes/resources/kudos.tsx"),
  route("rss", "routes/resources/rss.tsx"),
  route(":slug/social", "routes/social-grid.tsx"),
  route(":slug.png", "routes/resources/og-image.tsx"),
  route("posts.json", "routes/resources/posts.tsx"),
  ...routes("routes/post.tsx"),
  route("*", "routes/404.tsx"),
] satisfies RouteConfig;
