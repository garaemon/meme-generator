# Meme Generator

[Live Demo](https://meme.garaemon.com)

A browser-based, serverless Meme Generator built with Next.js, Fabric.js, and Dexie.js.

## Features

*   **No Server/DB Required**: All data (templates, history) is stored locally in your browser using IndexedDB.
*   **Rich Editor**: Drag & drop multi-line text, change fonts (Impact, Anton, etc.), colors, outlines, alignment, all caps, and drop shadows.
*   **Undo/Redo**: Revert edits with the Undo/Redo buttons, Ctrl/Cmd+Z (undo), and Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y (redo). Press Delete or Backspace to remove the selected text.
*   **Template Gallery**: Choose from presets or upload your own images.
*   **History & Timeline**: Automatically saves your memes. Re-edit past creations anytime.
*   **Export**: Download your memes as PNG or GIF files, copy PNG memes to the clipboard, or share them through the native share sheet on supported devices.

## Tech Stack

*   **Framework**: Next.js 16 (App Router, static export)
*   **Hosting**: Cloudflare Workers (static assets + a small Worker for the image proxy)
*   **Language**: TypeScript
*   **Canvas Engine**: Fabric.js (v6/v7)
*   **Database**: Dexie.js (IndexedDB wrapper)
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React

## Getting Started

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Generate the Cloudflare Workers types for `worker/` (rerun after editing
    `wrangler.jsonc`; `npm run build` also runs this step):
    ```bash
    npm run cf-typegen
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) with your browser.

## Deployment

The app is deployed to [Cloudflare Workers](https://developers.cloudflare.com/workers/).
`next build` produces a static export in `out/`, which Workers serves as static
assets. Only `/api/image-proxy` runs code: `worker/index.ts` fetches template
images from the allowed hosts (imgflip and giphy) and caches them at the edge.
Under `next dev` the same proxy logic (`src/lib/image-proxy.ts`) is served by
`src/app/api/image-proxy/route.dev.ts` instead.

*   Preview the production build locally:
    ```bash
    npm run preview
    ```
    and open [http://localhost:8787](http://localhost:8787).
*   Deploy manually (requires `npx wrangler login`):
    ```bash
    npm run deploy
    ```
*   Pushes to `main` are deployed by [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)
    (Cloudflare's Git integration), configured in the Cloudflare dashboard with
    build command `npm run build` and deploy command `npx wrangler deploy`.
*   Pushes to any other branch create a [Worker Preview](https://developers.cloudflare.com/workers/previews/)
    (Preview command `npx wrangler preview`). Its URL stays the same for the
    branch and is posted as a comment on the pull request.

## How to Use

1.  **Gallery**: Select a template or upload an image.
2.  **Editor**:
    *   **Add Text**: Click "Add Text" to add a new text block.
    *   **Edit**: Select text to change content, font, color, and stroke (outline).
    *   **Move/Resize**: Drag text to move, use handles to resize/rotate.
    *   **Download**: Click "Download Meme" to save as PNG and add to History.
3.  **History**: View your past creations. Click one to edit it again.

## License

Apache