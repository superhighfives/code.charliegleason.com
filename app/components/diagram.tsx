export default function Diagram({ src, alt }: { src: string; alt: string }) {
  const baseImage = `images/${src}`
  const darkImage = `${baseImage.split('.').join('-dark.')}`
  console.log(baseImage, darkImage)
  return (
    <div className="my-8">
      <picture className={`overflow-hidden rounded w-full align-top my-0`}>
        <source media="(prefers-color-scheme: dark)" srcSet={darkImage} />
        <img src={baseImage} alt={alt} className=" w-full" />
      </picture>
      <figcaption className="text-center leading-relaxed text-balance flex-shrink px-8 mb-2">
        {alt}
      </figcaption>
    </div>
  )
}
