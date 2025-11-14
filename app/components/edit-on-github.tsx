import { GitBranch } from "lucide-react";

export default function EditOnGitHub({
  date,
  slug,
}: {
  date: string;
  slug: string;
}) {
  const formattedDate = date.split("T")[0];

  return (
    <a
      className="font-mono inline-flex items-center gap-2 text-xs link-secondary focus-ring-primary"
      href={`https://github.com/superhighfives/code.charliegleason.com/edit/main/posts/${formattedDate}.${slug}.mdx`}
    >
      <GitBranch className="shrink-0" size={16} />
      <span>Edit on GitHub</span>
    </a>
  );
}
