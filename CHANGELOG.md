# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning.

## [Unreleased]
- Improve Elastic ECS structure and mappings
- Docs: add more ingestion pipeline examples

## [3.0.0] - 2025-10-20
### Added
- ECS-style fields across all events
- `trace()` mapping for `trace.id`, `span.id`, `transaction.id`
- Buffered file appends with periodic flush
- Automatic gzip rotation when a log file exceeds ~1MB (`compressEnabled`)
- HTTP(S) POST output via `outputUri`
- Rich text output for `dev` mode (colorized)
- TypeScript definitions (`index.d.ts`)
- Expanded README with configuration and examples

### Changed
- Centralized configuration via live getters/setters on the exported function
- Safer `uncaughtException` path with exit safety net

### Fixed
- Robust file creation and directory handling
- More resilient compression and I/O error handling

[Unreleased]: https://github.com/manuel-lohmus/log-report/compare/v3.0.0...HEAD
[3.0.0]: https://github.com/manuel-lohmus/log-report/releases/tag/v3.0.0