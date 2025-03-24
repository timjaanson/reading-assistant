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

### Development

Run the extension in development mode with hot reloading:

```
npm run dev
```

This will:

- Start a development server
- Enable hot reloading
- Allow you to view the main popup (extension content when clicking on the extension icon)
- Allow you to view the options/settings page

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

The extension adds a tooltip whenever you highlight text on a webpage:

1. Select any text on a webpage by clicking and dragging with your mouse
2. A tooltip will appear above the selected text
3. Click on the "Summary" button in the tooltip
4. Currently, this will log the selected text to the console (visible in developer tools)

This feature is designed to be extensible, allowing for more actions to be added in the future, such as:

- Generating explanations
- Looking up definitions
- Providing translations
- Creating summaries

## Contributing

[Add contribution guidelines if applicable]

## License

[Add license information if applicable]
