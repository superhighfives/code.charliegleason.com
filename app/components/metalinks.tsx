export type MetaData = { key: string; value: string }

export default function Metadata({ links }: { links?: MetaData[] }) {
  return links ? (
    <dl className="border-t border-gray-100 max-w-[65ch]">
      <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="font-medium leading-6 text-gray-900">Links</dt>
        <dd className="mt-2 text-gray-900 sm:col-span-2 bg-white">
          <div className="divide-y divide-gray-100 rounded-md border border-gray-200">
            {links.map((item: { key: string; value: string }) => {
              const url = new URL(item.value)
              return (
                <a
                  key={JSON.stringify(item)}
                  href={item.value}
                  className="flex items-center justify-between p-4 leading-6 group hover:bg-slate-50"
                >
                  <div className="flex w-0 flex-1 items-center">
                    <div className="flex min-w-0 flex-1 gap-2">
                      <span className="truncate font-medium">{item.key}</span>
                      <span className="flex-shrink-0 text-gray-400">
                        {url.hostname}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className="font-medium text-indigo-600 group-hover:text-indigo-500">
                      Visit
                    </span>
                  </div>
                </a>
              )
            })}
          </div>
        </dd>
      </div>
    </dl>
  ) : null
}
