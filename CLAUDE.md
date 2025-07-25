# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

- `npm run build` - Build project (TypeScript compilation + Vite build)
- `npm run lint` - Run ESLint

### Chrome Extension Development

After building, load the `dist` folder as an unpacked extension in Chrome developer mode.

## Architecture Overview

This is a Chrome browser extension that enhances reading experience by providing AI-powered text analysis and research capabilities. The extension operates mostly in the sidepanel in the extension context, but it has capabilities of executing scripts to interact with the user's active browser tab (including PDF files via the custom PDF viewer)

### Core Structure

**Chrome Extension Architecture:**

- Background service worker (`src/chrome-extension/background/`) handles extension lifecycle and PDF URL interception
- Side panel (`main.html`) provides the main extension interface
- Main view (`src/chrome-extension/views/MainView`) that handles routing between different views
- PDF viewer (`pdf-viewer.html`) handles PDF-specific rendering functionality

**Key Components:**

- **AI Integration** (`src/chrome-extension/ai/`): Multi-provider AI system supporting Anthropic, OpenAI, Google, and other OpenAI compatible providers with MCP (Model Context Protocol) client support through SSE transport
  - **AI SDK**: Uses Vercel's AI SDK for inference with LLMs (doing the calls, tool execution etc), including Vercel's AI SDK UI for react hooks to manage messages, sending
- **Storage Layer** (`src/chrome-extension/storage/`): Dexie-based IndexedDB storage for chats, memories, and other settings stored in extension localstorage for other settings
- **Realtime Features** (`src/chrome-extension/realtime/`): Voice interaction capabilities
- **PDF Viewing** (`src/chrome-extension/pdf-viewer/`): Custom PDF viewer using PDF.js to allow for custom script execution to extract PDF text content

### AI Provider System

The extension supports multiple AI providers configured through a unified interface:

- Provider settings stored in IndexedDB
- Only one provider can be "active" at a time
- Supports temperature, topK, and other model-specific parameters
- MCP clients for extended tool capabilities

### Data Flow

1. User interacts with extension through sidepanel interface or optionally through extension options view (same views as the regular sidepanel view)
2. Extension can execute scripts on active tab to extract page content using 'html-to-text' library when prompted by the user in chat or when manually selecting that in chat view
3. Text content is stripped of HTML tags, preserving only necessary text and elements
4. Processed content + user queries sent to active AI provider
5. AI responses streamed back and displayed in extension sidepanel
6. Conversations stored in local IndexedDB
7. Memory system managed manually through extension UI or automatically via AI tools when enabled

### React Conventions

- Never separately import React for .tsx components unless using React.someValue directly
- Uses shadcn/ui components with Radix UI primitives
  - shadcn components located at `src/components/ui`
- Tailwind CSS v4 for styling with custom theme support. Uses tailwind v4 css file based configuration. DOES NOT USE tailwind.config.js!
- TypeScript throughout with strict type checking

### Extension Permissions

Key permissions: storage, downloads, sidePanel, declarativeNetRequest, activeTab, scripting
Host permissions for PDF access across HTTP/HTTPS and file:// protocols
