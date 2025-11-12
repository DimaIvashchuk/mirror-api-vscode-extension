# Mirror API - HTTP Proxy & Request Logger

> **Perfect for Frontend and Backend Developers** - Debug API calls and monitor HTTP requests during development without leaving VSCode.

## 🎥 Demo

<!-- Add your demo video or GIF here -->
![Demo](/media/demo.gif)

## Overview

Mirror API is a powerful VSCode extension that provides an HTTP proxy server with real-time request/response logging and inspection. Whether you're a **frontend developer** debugging API integrations or a **backend developer** testing endpoints, Mirror API gives you complete visibility into your HTTP traffic.

### Why Frontend Developers Love It

- 🔍 **Debug API Calls** - See exactly what your frontend is sending to the backend
- 📊 **Inspect Responses** - View full response bodies, headers, and status codes
- 🐛 **Catch Issues Early** - Identify malformed requests before they reach production
- ⚡ **Test Different Scenarios** - Monitor how your app handles various API responses

### Why Backend Developers Love It

- 🔌 **Test API Endpoints** - Verify your API returns correct responses
- 🔐 **Debug Authentication** - Inspect headers, tokens, and auth flows
- 📝 **Document Requests** - Capture real request/response examples for documentation
- 🚀 **Development Workflow** - No need for external proxy tools, everything in VSCode

## Features

- **Built-in HTTP Proxy Server** - Start a local proxy server directly from VSCode
- **Dual Mode Support** - Works with any HTTP client (axios, fetch, curl, etc.)
- **Request Interception** - Captures all HTTP/HTTPS requests passing through the proxy
- **Detailed Logging** - View complete request and response details including:
  - Request URL, method, and headers
  - Response status code, headers, and body
  - Timestamps for each request
  - Automatic decompression (gzip, deflate, brotli)
- **Beautiful UI** - Clean, VSCode-themed interface for viewing logs
- **Collapsible Log Entries** - Expand entries to see full request/response details
- **Easy Configuration** - Simple port selection (default: 8888)

## Usage

### Starting the Proxy Server

1. Open the Command Palette (`Cmd+Shift+P` on macOS or `Ctrl+Shift+P` on Windows/Linux)
2. Type "Mirror API: Start Proxy Server"
3. Enter the port number (default: 8888)
4. The proxy server will start and display a confirmation message

### Viewing Logs

1. Open the Command Palette
2. Type "Mirror API: Show Logs Panel"
3. A webview panel will open showing all captured requests
4. Click on any log entry to expand and view full details

## Configure Your Application

Mirror API supports **two modes** of operation:

### Mode 1: Standard Proxy (Recommended for axios, curl)

Configure your application to use Mirror API as a standard HTTP proxy:

**Axios:**
```javascript
import axios from 'axios';

axios.get('https://api.example.com/data', {
    proxy: {
        host: 'localhost',
        port: 8888,
        protocol: 'http',
    }
});
```

**cURL:**
```bash
curl -x http://localhost:8888 https://api.example.com/data
```

**Environment Variables:**
```bash
export HTTP_PROXY=http://localhost:8888
export HTTPS_PROXY=http://localhost:8888

# Now all HTTP requests will go through the proxy
node your-app.js
```

### Mode 2: Path-based Proxy (Perfect for fetch, node-fetch)

Prepend the proxy URL to your target URL:

**Node-fetch:**
```javascript
import fetch from 'node-fetch';

fetch('http://localhost:8888/https://api.example.com/data')
    .then(res => res.json())
    .then(data => console.log(data));
```

**Native fetch (Node 18+):**
```javascript
fetch('http://localhost:8888/https://jsonplaceholder.typicode.com/todos/1')
    .then(res => res.json())
    .then(data => console.log(data));
```

**Browser fetch (for local development):**
```javascript
// In your development environment
const API_BASE = 'http://localhost:8888/https://api.example.com';

fetch(`${API_BASE}/users`)
    .then(res => res.json())
    .then(users => console.log(users));
```

## Commands

- `Mirror API: Start Proxy Server` - Start the HTTP proxy server
- `Mirror API: Show Logs Panel` - Open the logs viewer panel

## Requirements

- Visual Studio Code version 1.60.0 or higher
- Node.js (included with VSCode)

## Use Cases

### Frontend Development
- Debug React/Vue/Angular API calls
- Test API error handling
- Inspect WebSocket handshakes
- Monitor third-party API integrations
- Capture requests for bug reports

### Backend Development
- Test API endpoints during development
- Debug microservice communication
- Inspect request/response formats
- Validate authentication flows
- Monitor database query results

### Full Stack Development
- Debug entire request/response cycle
- Test frontend-backend integration
- Capture real-world request examples
- Document API behavior
- Troubleshoot CORS issues

## Tips

- Keep the logs panel open while making requests to see them in real-time
- Use the "Clear Logs" button to reset the log history
- The proxy automatically handles both HTTP and HTTPS requests
- Logs are limited to the last 1000 requests to prevent memory issues
- Response bodies are capped at 1MB to avoid performance degradation
- Both proxy modes work simultaneously - use whichever is more convenient

## Known Issues

- Binary responses are not displayed in full (shows size instead)
- Large response bodies (>1MB) show size information only
- The proxy server runs only while VSCode is open

## Release Notes

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes.

### 0.0.1

Initial release with core proxy and logging functionality.

---

**Enjoy debugging your APIs!** 🚀

If you find this extension useful, please consider leaving a review or starring the repository.
