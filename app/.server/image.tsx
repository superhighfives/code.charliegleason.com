import { Resvg } from '@resvg/resvg-js'
import type { SatoriOptions } from 'satori'
import satori from 'satori'

import { OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT } from '~/routes/resource.og'

// Load the font from the "public" directory
const fontSans = (baseUrl: string) =>
  fetch(new URL(`${baseUrl}/fonts/JetBrainsMono-SemiBold.ttf`)).then((res) =>
    res.arrayBuffer()
  )

export async function createOGImage(title: string, requestUrl: string) {
  const fontSansData = await fontSans(requestUrl)
  const options: SatoriOptions = {
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    fonts: [
      {
        name: 'Inter',
        data: fontSansData,
        style: 'normal',
      },
    ],
  }

  // Design the image and generate an SVG with "satori"
  const svg = await satori(
    <div
      style={{
        width: options.width,
        height: options.height,
        background: `url(${requestUrl}/social-default.png)`,
        backgroundSize: '1200 630',
        padding: '100px',
        color: 'white',
        fontFamily: 'Inter',
        fontSize: 60,
        display: 'flex',
      }}
    >
      <div
        style={{
          display: 'block',
          lineClamp: 3,
        }}
      >
        {title}
      </div>
    </div>,
    options
  )

  // Convert the SVG to PNG with "resvg"
  const resvg = new Resvg(svg)
  const pngData = resvg.render()
  return pngData.asPng()
}
