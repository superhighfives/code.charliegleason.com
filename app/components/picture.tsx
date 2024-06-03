export default function Picture({
  src,
  alt,
  themed = false,
}: {
  src: string
  alt: string
  themed: boolean
}) {
  const baseImage = `${src}`
  const darkImage = `${baseImage.split('.').join('-dark.')}`

  return (
    <div className="my-8 space-y-4">
      <picture
        className={`overflow-hidden rounded shadow-xl w-full align-top my-0`}
      >
        {themed ? (
          <source media="(prefers-color-scheme: dark)" srcSet={darkImage} />
        ) : null}
        <img src={baseImage} alt={alt} className="w-full" />
      </picture>
      <figcaption className="text-center leading-relaxed text-balance mb-2">
        {alt}
      </figcaption>
    </div>
  )
}
