# Repository Guidelines

## Project Structure & Module Organization
Core extension logic lives in `src/chrome-extension/`, with subfolders for `background/` events, `views/` sidepanel screens, `ai/` provider adapters, `storage/` persistence helpers, and shared view widgets in `views-components/`. Shared shadcn/ui primitives sit under `src/components/ui`, while lightweight helpers reside in `src/lib/utils.ts`. Static assets, including PDF `cmaps`, live in `public/`; Vite copies them into `dist/`, which is the folder you load via `chrome://extensions`. The sidepanel and PDF viewer bundle from `main.html` and `pdf-viewer.html`, matching the multi-entry inputs declared in `vite.config.ts`.

## Build, Test, and Development Commands
- `npm install` — install dependencies once after cloning.
- `npx vite build --watch --mode development` — rebuilds into `dist/` whenever files change; keep this running while testing the unpacked extension.
- `npm run build` — produces a production bundle with source maps in `dist/`.
- `npm run lint` — runs ESLint using `eslint.config.js` to catch TypeScript and React issues before PR review.

## Coding Style & Naming Conventions
TypeScript is required everywhere; enable `strict` mode locally to match `tsconfig`. Use two-space indentation, keep trailing commas where TypeScript allows them, and prefer double quotes to align with the current codebase. React components export PascalCase names (`MainView`), hooks use camelCase (`useConversationStore`), and utility modules stay lowercase-dash (`storage/index.ts`). Tailwind classes should remain utility-first; consolidate complex variants with `clsx` or `class-variance-authority` helpers already in use. Run `npm run lint` and rely on your editor's ESLint integration instead of committing ad-hoc formatting.

## Testing Guidelines
There is no automated test suite yet, so treat manual verification as mandatory. After each change, rebuild with `--watch`, reload the unpacked extension, and exercise the sidepanel flows plus the PDF viewer hosted at `pdf-viewer.html`. Document the scenarios you covered (e.g., provider selection, memory management, PDF parsing) in the PR description. If you introduce code that is practical to unit test, scaffold `*.test.ts` files alongside the module and note the framework choice so we can standardize on it in a follow-up.

## Commit & Pull Request Guidelines
Commits in this repo are short, imperative, and lowercase (e.g., `remove unnecessary sessionId generation`). Follow that style, keep each commit focused, and include only build artifacts that are required for review. Pull requests should describe the change, reference any GitHub issues, list manual testing steps, and attach before/after screenshots for UI tweaks. Flag any migrations or configuration changes explicitly so reviewers can verify extension upgrade paths.
