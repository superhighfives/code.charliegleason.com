export default function InlineCode({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <code className="[word-break:break-word] not-prose px-0.5 text-green-600 font-normal dark:text-green-300 rounded-xs bg-green-100 dark:bg-gray-800 ring-2 ring-green-100 dark:ring-gray-800 before:content-none after:content-none">
      {children}
    </code>
  );
}
