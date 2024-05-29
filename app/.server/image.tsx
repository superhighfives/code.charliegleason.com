import { Resvg, initWasm as initResvg } from '@resvg/resvg-wasm'
import type { SatoriOptions } from 'satori'
import satori, { init as initSatori } from 'satori/wasm'
import initYoga from 'yoga-wasm-web'
import type { PostMeta } from './posts'

import { OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT } from '~/routes/resource.og'

import YOGA_WASM from 'yoga-wasm-web/dist/yoga.wasm?url'
import RESVG_WASM from '@resvg/resvg-wasm/index_bg.wasm?url'

let initialised = false

// Load the font from the "public" directory
const fontSans = (baseUrl: string) =>
  fetch(new URL(`${baseUrl}/fonts/JetBrainsMono-SemiBold.ttf`)).then((res) =>
    res.arrayBuffer()
  )

export async function createOGImage(requestUrl: string, slug: string | null) {
  try {
    if (!slug) {
      throw new Error('No slug provided')
    }

    const url = new URL(requestUrl)
    url.pathname = `/${slug}.json`
    const data: PostMeta = await fetch(url).then(
      async (res) => await res.json()
    )

    if (!data) {
      throw new Error('No data found')
    }

    const { title, description } = data.frontmatter

    const { default: resvgwasm } = await import(
      /* @vite-ignore */ `${RESVG_WASM}?module`
    )
    const { default: yogawasm } = await import(
      /* @vite-ignore */ `${YOGA_WASM}?module`
    )

    try {
      if (!initialised) {
        await initResvg(resvgwasm)
        await initSatori(await initYoga(yogawasm))
        initialised = true
      }
    } catch (e) {
      initialised = true
    }

    const fontSansData = await fontSans(requestUrl)
    const options: SatoriOptions = {
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      fonts: [
        {
          name: 'JetBrainsMono-Semibold',
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
          gap: '24',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'block',
            fontSize: 60,
            lineClamp: 2,
            lineHeight: 1.25,
          }}
        >
          {title}
        </div>
        {description ? (
          <div
            style={{
              display: 'block',
              fontSize: 30,
              lineClamp: 2,
              lineHeight: 1.5,
            }}
          >
            {description}
          </div>
        ) : null}
      </div>,
      options
    )

    // Convert the SVG to PNG with "resvg"
    const resvg = new Resvg(svg)
    const pngData = resvg.render()
    return pngData.asPng()
  } catch (e) {
    console.log(e)
    const url = new URL(requestUrl)
    url.pathname = '/social-default.png'
    return await fetch(url).then((res) => res.body)
  }
}
