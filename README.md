# node-server-office-js

Node server to execute office.js on an Office Document.

## Hello World Server

Install dependencies:

```bash
npm install
```

Build TypeScript:

```bash
npm run build
```

Start server:

```zsh
npm start
```

Or run build + start in one command:

```zsh
npm run dev
```

The server listens on `PORT` when provided, otherwise defaults to `3000`.

Test with:

```zsh
curl http://localhost:3000
```

Expected response:

```zsh
Hello World
```

## Tests (Playwright)

Run tests:

```zsh
npm test
```

Run tests with Playwright UI mode:

```zsh
npm run test:ui
```

## Formatting (Prettier)

Format source and test files:

```zsh
npm run style
```

Check formatting without changing files:

```zsh
npm run style-check
```
