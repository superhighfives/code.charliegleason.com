import { parseISO, format } from 'date-fns'

export type MetaData = { key: string; value: string }

export default function Metadata({ data }: { data?: MetaData[] }) {
  return data ? (
    <dl className="divide-y divide-gray-100 border-b border-gray-100 max-w-[65ch]">
      {data.map((item: { key: string; value: string }) => {
        return (
          <div
            key={JSON.stringify(item)}
            className="py-3 sm:grid sm:grid-cols-3 sm:gap-4"
          >
            <dt className="font-medium text-gray-900">{item.key}</dt>
            <dd className="mt-1 text-gray-700 sm:col-span-2 sm:mt-0">
              {item.key === 'First Published'
                ? format(parseISO(item.value), 'dd/MM/yyyy')
                : item.value}
            </dd>
          </div>
        )
      })}
    </dl>
  ) : null
}
