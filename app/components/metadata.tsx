export type MetaData = { key: string; value: string }

export default function Metadata({
  data,
  links,
}: {
  data?: MetaData[]
  links?: MetaData[]
}) {
  return data || links ? (
    <dl className="divide-y divide-gray-100 max-w-[65ch]">
      {data &&
        data.map((item: { key: string; value: string }) => {
          return (
            <div
              key={JSON.stringify(item)}
              className="py-3 sm:grid sm:grid-cols-3 sm:gap-4"
            >
              <dt className="font-medium leading-6 text-gray-900">
                {item.key}
              </dt>
              <dd className="mt-1 leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {item.value}
              </dd>
            </div>
          )
        })}

      {links ? (
        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
          <dt className="font-medium leading-6 text-gray-900">Links</dt>
          <dd className="mt-2 text-gray-900 sm:col-span-2 sm:-mt-3 relative -top-px bg-white">
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
      ) : null}
    </dl>
  ) : null
}
