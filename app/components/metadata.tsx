import { format, parseISO } from "date-fns";
import { MAX_WIDTH_CLASS } from "~/config/constants";
import type { MetaData } from "~/mdx/types";

export default function Metadata({
  data,
  style,
}: {
  data?: MetaData[];
  style?: React.CSSProperties;
}) {
  return data?.length ? (
    <dl
      className={`font-mono text-sm divide-y divide-gray-200 dark:divide-gray-800 border-y border-gray-200 dark:border-gray-800 ${MAX_WIDTH_CLASS}`}
      style={style}
    >
      {data.map((item: { key: string; value: string }) => {
        const date = /(\d{4})-(\d{2})-(\d{2})/.exec(item.value);
        return (
          <div
            key={JSON.stringify(item)}
            className="sm:px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 leading-6"
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
