# Progress Update
- **Refactoring Migration**: Moved from `main.ts`/`preload.ts` to `main.cts`/`preload.cts`.
- **Reasoning**: In a project with `"type": "module"`, `.js` files are treated as ESM. By using `.cts`, TypeScript generates `.cjs` files, which Node/Electron correctly identifies as CommonJS regardless of the root `package.json`.
- **Configuration Updates**:
    - `package.json`: `main` updated to `electron/main.cjs`.
    - `electron-builder.json`: `main` updated to `electron/main.cjs`.
    - `electron/main.cts`: Preload path updated to `preload.cjs`.
- **Status**: Currently rebuilding to verify compilation.
