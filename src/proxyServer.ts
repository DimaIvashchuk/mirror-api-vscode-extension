import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';
import * as zlib from 'zlib';

export interface RequestLog {
    id: string;
    timestamp: number;
    method: string;
    url: string;
    requestHeaders: Record<string, string | string[] | undefined>;
    statusCode?: number;
    responseHeaders?: Record<string, string | string[] | undefined>;
    responseBody?: string;
    error?: string;
}

export class ProxyServer {
    private server: http.Server | null = null;
    private port: number;
    private logs: RequestLog[] = [];
    private onLogAdded?: (log: RequestLog) => void;

    constructor(port: number, onLogAdded?: (log: RequestLog) => void) {
        this.port = port;
        this.onLogAdded = onLogAdded;
    }

    start(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.server = http.createServer((clientReq, clientRes) => {
                this.handleRequest(clientReq, clientRes);
            });

            this.server.on('error', (err) => {
                reject(err);
            });

            this.server.listen(this.port, () => {
                console.log(`Proxy server listening on port ${this.port}`);
                resolve();
            });
        });
    }

    stop(): Promise<void> {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    console.log('Proxy server stopped');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    getLogs(): RequestLog[] {
        return this.logs;
    }

    clearLogs(): void {
        this.logs = [];
    }

    private handleRequest(clientReq: http.IncomingMessage, clientRes: http.ServerResponse): void {
        let requestUrl = clientReq.url || '';
        const method = clientReq.method || 'GET';
        
        // Generate unique ID for this request
        const logId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Support two modes:
        // 1. Standard proxy mode: URL is full URL (http://target.com/path)
        // 2. Path-based mode: URL is /http://target.com/path or /https://target.com/path
        
        let actualTargetUrl: string;
        
        if (requestUrl.startsWith('http://') || requestUrl.startsWith('https://')) {
            // Mode 1: Standard proxy (e.g., from axios with proxy config)
            actualTargetUrl = requestUrl;
        } else if (requestUrl.startsWith('/http://') || requestUrl.startsWith('/https://')) {
            // Mode 2: Path-based proxy (e.g., fetch('http://localhost:8888/https://api.example.com'))
            actualTargetUrl = requestUrl.substring(1); // Remove leading '/'
        } else {
            // Try to construct URL from Host header (fallback)
            const host = clientReq.headers.host;
            if (host) {
                // Assume http if not specified
                actualTargetUrl = `http://${host}${requestUrl}`;
            } else {
                actualTargetUrl = requestUrl;
            }
        }
        
        // Create log entry
        const log: RequestLog = {
            id: logId,
            timestamp: Date.now(),
            method: method,
            url: actualTargetUrl,
            requestHeaders: { ...clientReq.headers }
        };

        console.log(`[Proxy] ${method} ${actualTargetUrl}`);

        // Parse the target URL
        let targetUrl: URL;
        try {
            targetUrl = new URL(actualTargetUrl);
        } catch (error) {
            log.error = `Invalid URL: ${actualTargetUrl}`;
            log.statusCode = 400;
            this.addLog(log);
            
            clientRes.writeHead(400, { 'Content-Type': 'text/plain' });
            clientRes.end('Bad Request: Invalid URL');
            return;
        }

        // Determine if we need http or https
        const isHttps = targetUrl.protocol === 'https:';
        const httpModule = isHttps ? https : http;

        // Prepare request options
        const requestHeaders = { ...clientReq.headers };
        delete requestHeaders.host; // Remove host header to avoid conflicts
        
        const options: https.RequestOptions = {
            hostname: targetUrl.hostname,
            port: targetUrl.port || (isHttps ? 443 : 80),
            path: targetUrl.pathname + targetUrl.search,
            method: method,
            headers: requestHeaders
        };

        // Make the proxied request
        const proxyReq = httpModule.request(options, (proxyRes) => {
            // Capture response details
            log.statusCode = proxyRes.statusCode;
            log.responseHeaders = { ...proxyRes.headers };

            // Capture response body for logging
            const responseChunks: Buffer[] = [];
            
            proxyRes.on('data', (chunk: Buffer) => {
                responseChunks.push(chunk);
            });

            proxyRes.on('end', () => {
                // Combine response chunks
                const responseBuffer = Buffer.concat(responseChunks);
                
                // Decompress if needed before logging
                this.decompressAndLog(responseBuffer, log);
            });

            // Forward response to client (keep original compressed format)
            clientRes.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
            proxyRes.pipe(clientRes);
        });

        proxyReq.on('error', (error) => {
            log.error = error.message;
            log.statusCode = 502;
            this.addLog(log);

            clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
            clientRes.end(`Proxy Error: ${error.message}`);
        });

        // Forward request body
        clientReq.pipe(proxyReq);
    }

    private decompressAndLog(responseBuffer: Buffer, log: RequestLog): void {
        const encoding = log.responseHeaders?.['content-encoding'] as string | undefined;
        
        // If response is too large, just show size
        if (responseBuffer.length > 1024 * 1024) { // 1MB limit
            log.responseBody = `[Large response: ${responseBuffer.length} bytes]`;
            this.addLog(log);
            return;
        }

        // Helper to convert buffer to string
        const bufferToString = (buffer: Buffer): void => {
            try {
                log.responseBody = buffer.toString('utf-8');
            } catch (error) {
                log.responseBody = `[Binary data: ${buffer.length} bytes]`;
            }
            this.addLog(log);
        };

        // Decompress based on encoding
        if (encoding === 'gzip') {
            zlib.gunzip(responseBuffer, (err, decompressed) => {
                if (err) {
                    log.responseBody = `[Failed to decompress gzip: ${err.message}]`;
                    this.addLog(log);
                } else {
                    bufferToString(decompressed);
                }
            });
        } else if (encoding === 'deflate') {
            zlib.inflate(responseBuffer, (err, decompressed) => {
                if (err) {
                    log.responseBody = `[Failed to decompress deflate: ${err.message}]`;
                    this.addLog(log);
                } else {
                    bufferToString(decompressed);
                }
            });
        } else if (encoding === 'br') {
            zlib.brotliDecompress(responseBuffer, (err, decompressed) => {
                if (err) {
                    log.responseBody = `[Failed to decompress brotli: ${err.message}]`;
                    this.addLog(log);
                } else {
                    bufferToString(decompressed);
                }
            });
        } else {
            // No compression or unknown encoding
            bufferToString(responseBuffer);
        }
    }

    private addLog(log: RequestLog): void {
        this.logs.push(log);
        
        // Limit logs to prevent memory issues (keep last 1000)
        if (this.logs.length > 1000) {
            this.logs.shift();
        }

        // Notify listener
        if (this.onLogAdded) {
            this.onLogAdded(log);
        }
    }

    getPort(): number {
        return this.port;
    }
}

