# Project Guidelines

## Code Style
- Use TypeScript with strict typing (see tsconfig.json).
- Prefer Node built-in imports with the node: prefix (example: src/index.ts).
- Keep server responses explicit about status and content type.

## Architecture
- Keep this repository as a minimal Node HTTP server scaffold centered on src/index.ts.
- Treat src/ as source of truth and dist/ as generated build output from tsc.
- Keep Playwright test configuration in configs/playwright.config.ts and tests in test/.

## Build and Test
- Install dependencies: npm install
- Build: npm run build
- Start server: npm start
- Build and start: npm run dev
- Run tests: npm test
- Run tests in UI mode: npm run test:ui

## Conventions
- Default server port is 3000 unless PORT is set.
- Keep endpoint behavior stable unless task explicitly requests API changes; current root endpoint returns plain text Hello World.
- When updating test behavior, align with Playwright webServer settings in configs/playwright.config.ts.
- Prefer integration coverage for HTTP behavior using Playwright request tests similar to test/test.ts.

## Documentation
- Use README.md for setup and quick-start details rather than duplicating long instructions here.
