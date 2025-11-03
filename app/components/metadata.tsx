import { format, parseISO } from "date-fns";
import type { MetaData } from "~/mdx/types";

export default function Metadata({ data }: { data?: MetaData[] }) {
  return data?.length ? (
    <dl className="divide-y divide-gray-200 dark:divide-gray-800 border-y border-gray-200 dark:border-gray-800 max-w-[65ch]">
      {data.map((item: { key: string; value: string }) => {
        const date = /(\d{4})-(\d{2})-(\d{2})/.exec(item.value);
        return (
          <div
            key={JSON.stringify(item)}
            className="sm:px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4"
          >
            <dt className="font-semibold text-gray-400 dark:text-gray-500">
              {item.key}
            </dt>
            <dd className="mt-1 text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
              {date ? format(parseISO(item.value), "dd/MM/yyyy") : item.value}
            </dd>
          </div>
        );
      })}
    </dl>
  ) : null;
}
