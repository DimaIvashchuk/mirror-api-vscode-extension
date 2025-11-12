# Change Log

All notable changes to the "mirror-api" extension will be documented in this file.

## [0.0.1] - 2025-11-12

### Added
- Initial release of Mirror API extension
- HTTP/HTTPS proxy server with configurable port (default: 8888)
- **Dual-mode proxy support:**
  - Standard proxy mode (for axios, curl, environment variables)
  - Path-based proxy mode (for fetch, node-fetch - no proxy agent needed!)
- Real-time request/response interception and logging
- Webview panel for viewing captured requests
- Collapsible log entries showing:
  - Request URL, method, and headers
  - Response status code, headers, and body (decompressed)
  - Timestamp for each request
- Two main commands:
  - `Mirror API: Start Proxy Server` - Start the proxy server
  - `Mirror API: Show Logs Panel` - View captured logs
- Clear logs functionality
- Automatic response decompression (gzip, deflate, brotli)
- Memory management (limits to last 1000 requests)
- Response body size limiting (1MB per request)
- Clean VSCode-themed UI
- Status badges for request success/error states
- HTTP method badges
- Error handling and display

### Features for Developers
- **Frontend Developers:** Debug API calls, inspect responses, catch issues early
- **Backend Developers:** Test endpoints, debug authentication, document requests
- **Full Stack Developers:** Debug entire request/response cycle, test integrations

### Technical Details
- TypeScript implementation
- Modular proxy server in separate module
- Webview-based UI with custom styling
- Real-time log updates from extension to webview
- Proper cleanup on extension deactivation
- Supports both HTTP and HTTPS target URLs
- Automatic detection of compression encoding
- VSCode engine requirement: 1.60.0+
