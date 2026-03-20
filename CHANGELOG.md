# Changelog

## v1.0.1 - 2026-03-20

- Fixed Electron startup on macOS by resolving `sqlite3` with platform-aware lookup instead of a Windows-only command.
- Hardened tray initialization so a missing or invalid tray icon does not prevent the app from launching.
- Added the Electron runtime and source files required for packaged/runtime consistency in the repository.
