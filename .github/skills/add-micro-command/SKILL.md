---
name: add-micro-command
description: "Use when: adding a new micro command, micro-command handler, MicroCommandName enum value, runMicroCommand dispatcher case, or Playwright request test in this Node Office.js server repo."
argument-hint: "Name and behavior of the new micro command"
---

# Add Micro Command

## Goal
Add a new server micro command that follows the repository's existing TypeScript architecture and request-test pattern.

## When To Use
- The user asks to add a new micro command.
- The task mentions `MicroCommandName`, `runMicroCommand`, `/run-micro-commands`, or a new command under `src/server/handlers/microCommand/`.
- The command should be callable through the existing micro-command request body and return a typed result.

## Workflow
1. Read the current files before editing because this repo may have recent user or formatter changes:
   - `src/server/handlers/microCommand/MicroCommand.ts`
   - `src/server/handlers/microCommand/runMicroCommand.ts`
   - A nearby runner such as `runMicroCommandReadFileContents.ts` or the most similar existing command.
   - `test/test.ts` for request-test style.
2. Add the command name to `MicroCommandName` in `MicroCommand.ts`.
3. Add a command interface extending `MicroCommandBase`.
   - Include `parameters` only when the command needs input.
   - Keep the `name` property typed as the new `MicroCommandName` member.
4. Add a result interface extending `MicroCommandBaseResult`.
   - Use `success: true`.
   - Put command-specific data under `values` when returning data.
   - Do not change the shared `metrics` shape unless explicitly requested.
5. Add the command and result interfaces to the `MicroCommand` and `MicroCommandResult` union types.
6. Create `src/server/handlers/microCommand/runMicroCommand<CommandName>.ts`.
   - Import only the command and result types from `./MicroCommand`.
   - Return the typed result directly for simple metadata commands.
   - Use `async` only when the implementation awaits I/O or another async API.
7. Wire the runner into `runMicroCommand.ts`.
   - Import the runner.
   - Add a `case MicroCommandName.<CommandName>` that calls the runner.
   - Leave the existing default unknown-command handling intact.
8. Add focused Playwright request coverage in `test/test.ts`.
   - Post to `/run-micro-commands`.
   - Use `MicroCommandName.<CommandName>` rather than string literals when possible.
   - Parse as `MicroCommandBodyResult` and cast the first result to the command-specific result type.
   - Assert `response.ok()`, `success`, and any returned `values`.
9. Validate with diagnostics and `npm run compile`.
   - Run the focused Playwright test when it does not require Excel or platform-specific dependencies.

## Naming Conventions
- Enum value and interface suffix use PascalCase, for example `MetadataNodeVersion`.
- Runner file uses `runMicroCommand<CommandName>.ts`.
- Runner function uses `runMicroCommand<CommandName>`.
- Test name uses `Run Micro Command - <CommandName>`.

## Example Shape
For a metadata command with no parameters:

```ts
export interface MicroCommandExampleMetadata extends MicroCommandBase {
    name: MicroCommandName.ExampleMetadata;
}

export interface MicroCommandExampleMetadataResult extends MicroCommandBaseResult {
    success: true;
    values: {
        value: string;
    };
}
```

Runner:

```ts
import { MicroCommandExampleMetadata, MicroCommandExampleMetadataResult } from "./MicroCommand";

export function runMicroCommandExampleMetadata(
    _command: MicroCommandExampleMetadata,
): MicroCommandExampleMetadataResult {
    return { success: true, values: { value: "example" } };
}
```


