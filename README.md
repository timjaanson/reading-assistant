# Reading assistant

## Description

Reading assistant is a browser extension that helps with reading and comprehension by providing additional context and tools while browsing the web. This extension aims to enhance the reading experience by offering features like definitions, summaries, and related information for highlighted text.

## Technical Stack

- JavaScript/TypeScript
- React.js
- Chrome Extension API
- Vite (for building)
- Tailwind for styling
- Node.js and npm for package management

## Getting Started

### Prerequisites

- Node.js (v22.0.0 or higher recommended)
- npm (v10.8.0 or higher recommended)

### Installation

1. Clone the repository:

   ```
   git clone [your-repository-url]
   cd assisted-reading
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. If not on darwin-arm64

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

This will create a production-ready build in the `dist` (or similar) directory.

## Installing the Extension in Chrome-based Browsers

1. Open your Chrome-based browser (Chrome, Edge, Brave, etc.)
2. Navigate to the extensions page:
   - In Chrome: `chrome://extensions/`
   - In Edge: `edge://extensions/`
   - In Brave: `brave://extensions/`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click "Load unpacked"
5. Select the `dist` folder (or whatever folder contains your built extension)
6. The extension should now appear in your browser's toolbar

## Usage

### Text Selection Feature

#### Tooltip

The extension adds a tooltip by default for PDFs loaded using the extension.

For text selection tooltip on webpages, add a matching url or '\*' in the extension settings

1. Select any text on PDF or added website
2. A tooltip will appear above the selected text
3. Click on the "Summary" button or any other option in the tooltip
4. Embeds a floating window for interacting with an LLM based on the selected text

#### Right-click context menu

There is a right-click context menu item available if text is selected to perform the same operation, e.g. "Summary"

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
