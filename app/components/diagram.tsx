export default function Diagram({ src, alt }: { src: string; alt: string }) {
  const baseImage = `images/${src}`
  const darkImage = `${baseImage.split('.').join('-dark.')}`
  console.log(baseImage, darkImage)
  return (
    <picture className={`overflow-hidden rounded-lg inline-flex align-top`}>
      <source media="(prefers-color-scheme: dark)" srcSet={darkImage} />
      <img src={baseImage} alt={alt} />
    </picture>
  )
}
