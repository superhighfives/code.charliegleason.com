# code.charliegleason.com

This is a little code blog, built with React Router 7 and deployed on Cloudflare Workers. I wanted a fast, flexible, themable setup where I could write in MDX and include live, editable code examples in the posts.

## What it does

- 🚀 **React Router 7** with server-side rendering
- ⚡ **Cloudflare Workers** - everything runs on the edge
- 🎨 **AI-generated visuals** via Replicate with user-controlled variations per post
- 🍪 **Cookie-based routing** for clean URLs between index and posts
- 💻 **Live code blocks** powered by Sandpack
- 🤓 **WASM-powered** syntax highlighting with Shiki and OG image generation with Satori
- 📝 **MDX content** with full React component support
- 🖼️ **Dynamic social images** generated on-the-fly
- 🌓 **Dark and light themes** that respect system preferences
- 📡 **RSS feed** for your favorite feed reader

## How it works

Built with [React Router 7](https://reactrouter.com/) and deployed on [Cloudflare Workers](https://workers.cloudflare.com/).

Content is written in MDX. Code blocks are syntax-highlighted on the server using [Shiki](https://shiki.style/) with [Catppuccin themes](https://github.com/catppuccin/catppuccin). Interactive code blocks use [Sandpack](https://sandpack.codesandbox.io/) to provide a full in-browser editing experience with live preview. Open Graph images are generated dynamically using [Satori](https://github.com/vercel/satori), which renders React components to SVG.

## Running it locally

Prerequisites:
- Node.js 18 or later
- npm

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

Run tests:

```bash
npm test
```

## Deployment

Build for production:

```bash
npm run build
```

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

Generate types for Cloudflare bindings:

```bash
npm run typegen
```
