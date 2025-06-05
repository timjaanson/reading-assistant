# Reading assistant

## Description

Reading assistant is a Chrome browser extension that enhances reading experience by providing AI-powered text analysis and research capabilities. The extension operates in a sidepanel interface and can interact with active tab pages including PDFs through a custom PDF viewer.

## Usage

The extension provides AI-powered assistance through a sidepanel interface:

1. Open the extension sidepanel
2. Configure an AI provider (Anthropic, OpenAI, Google, or any OpenAI compatible provider) and add model(s)
3. Interact with pages and PDFs through the extension's chat interface
4. The extension can extract page content and PDF text for AI analysis
5. All data is persisted locally in the browser via IndexedDB or extension localstorage.
6. Memory system can be managed manually or automatically via AI tools (if enabled)

## Technical Stack

- TypeScript/React with strict type checking
- Vite for building
- Tailwind CSS v4
- Chrome Extension API (Manifest V3)
- Vercel AI SDK for LLM integration
- Dexie for IndexedDB storage
- PDF.js for custom PDF viewer
- shadcn/ui components with Radix UI primitives
- MCP (Model Context Protocol) client support with SSE transport for additional tools

## Getting Started

### Prerequisites

- Node.js (v22.0.0 or higher recommended)
- npm (v10.8.0 or higher recommended)

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/timjaanson/reading-assistant.git
   cd reading-assistant
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. If not on Apple silicon (darwin-arm64)

   ```
   npm i -D <os_specific_rollup_option>
   ```

   ```
   rollup OS specific dependencies:

   @rollup/rollup-android-arm-eabi
   @rollup/rollup-android-arm64
   @rollup/rollup-darwin-arm64
   @rollup/rollup-darwin-x64
   @rollup/rollup-freebsd-arm64
   @rollup/rollup-freebsd-x64
   @rollup/rollup-linux-arm-gnueabihf
   @rollup/rollup-linux-arm-musleabihf
   @rollup/rollup-linux-arm64-gnu
   @rollup/rollup-linux-arm64-musl
   @rollup/rollup-linux-loongarch64-gnu
   @rollup/rollup-linux-powerpc64le-gnu
   @rollup/rollup-linux-riscv64-gnu
   @rollup/rollup-linux-riscv64-musl
   @rollup/rollup-linux-s390x-gnu
   @rollup/rollup-linux-x64-gnu
   @rollup/rollup-linux-x64-musl
   @rollup/rollup-win32-arm64-msvc
   @rollup/rollup-win32-ia32-msvc
   @rollup/rollup-win32-x64-msvc
   ```

### Building for Production

Build the extension for Chrome:

```
npm run build
```

This will create a production-ready build in the `dist` directory.

## Installing the Extension in Chrome-based Browsers

1. Open your Chrome-based browser (Chrome, Edge, Brave, etc.)
2. Navigate to the extensions page:
   - In Chrome: `chrome://extensions/`
   - In Edge: `edge://extensions/`
   - In Brave: `brave://extensions/`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click "Load unpacked"
5. Select the `dist` folder
6. The extension should now appear in your browser's toolbar
7. Open the extension, set up your providers and mark one provider as `active`
8. Only one provider can be marked as `active`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Third-Party Licenses

This project includes Adobe cmap files for PDF parsing, which are licensed under their own terms. See [public/cmaps/LICENSE](public/cmaps/LICENSE) for details.
