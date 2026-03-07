import { GitBranch } from "lucide-react";
import { extractDateString } from "~/utils/date";

export default function EditOnGitHub({
  date,
  slug,
}: {
  date: string;
  slug: string;
}) {
  const formattedDate = extractDateString(date);

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
