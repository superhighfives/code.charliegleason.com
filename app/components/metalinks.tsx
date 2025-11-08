import LinkBlock from "~/components/link-block";

export type MetaData = { key: string; value: string };

export default function Metadata({ links }: { links?: MetaData[] }) {
  return links ? (
    <dl className="pt-2 max-w-xl">
      <dt className="sm:px-4 font-semibold leading-6 text-gray-900 dark:text-gray-500 font-mono">
        Links
      </dt>
      <dd className="mt-2 text-gray-900 bg-white dark:bg-gray-950">
        <div className="divide-y divide-gray-100 dark:divide-gray-900 rounded-md overflow-hidden border border-gray-200 dark:border-gray-800">
          {links.map((item: { key: string; value: string }) => {
            const url = new URL(item.value);
            return (
              <LinkBlock
                key={item.value}
                title={item.key}
                caption={url.hostname}
                action="Open"
                href={item.value}
              />
            );
          })}
        </div>
      </dd>
    </dl>
  ) : null;
}
