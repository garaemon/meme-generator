# Meme Generator

A browser-based, serverless Meme Generator built with Next.js, Fabric.js, and Dexie.js.

## Features

*   **No Server/DB Required**: All data (templates, history) is stored locally in your browser using IndexedDB.
*   **Rich Editor**: Drag & drop text, change fonts (Impact, Anton, etc.), colors, and outlines.
*   **Template Gallery**: Choose from presets or upload your own images.
*   **History & Timeline**: Automatically saves your memes. Re-edit past creations anytime.
*   **Export**: Download your memes as PNG files.

## Tech Stack

*   **Framework**: Next.js 15 (App Router)
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

2.  Run the development server:
    ```bash
    npm run dev
    ```

3.  Open [http://localhost:3000](http://localhost:3000) with your browser.

## How to Use

1.  **Gallery**: Select a template or upload an image.
2.  **Editor**:
    *   **Add Text**: Click "Add Text" to add a new text block.
    *   **Edit**: Select text to change content, font, color, and stroke (outline).
    *   **Move/Resize**: Drag text to move, use handles to resize/rotate.
    *   **Download**: Click "Download Meme" to save as PNG and add to History.
3.  **History**: View your past creations. Click one to edit it again.

## License

MIT