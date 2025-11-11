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
      className="font-mono inline-flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 focus-visible:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 dark:focus-visible:text-gray-300 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950"
      href={`https://github.com/superhighfives/code.charliegleason.com/edit/main/posts/${formattedDate}.${slug}.mdx`}
    >
      <GitBranch className="shrink-0" size={16} />
      <span>Edit on GitHub</span>
    </a>
  );
}
