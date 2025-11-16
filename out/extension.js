"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const proxyServer_1 = require("./proxyServer");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
let proxyServer = null;
let logsPanel = null;
let requestLogs = [];
function activate(context) {
    console.log('Mirror API extension is now active!');
    // Command 1: Start Proxy Server
    const startProxyCommand = vscode.commands.registerCommand('mirror-api.startProxy', async () => {
        // If proxy is already running, ask to stop it first
        if (proxyServer) {
            const action = await vscode.window.showWarningMessage(`Proxy server is already running on port ${proxyServer.getPort()}`, 'Stop Server', 'Cancel');
            if (action === 'Stop Server') {
                await stopProxyServer();
                vscode.window.showInformationMessage('Proxy server stopped');
            }
            return;
        }
        // Ask user for port number
        const portInput = await vscode.window.showInputBox({
            prompt: 'Enter the port number for the proxy server',
            value: '8888',
            validateInput: (value) => {
                const port = parseInt(value);
                if (isNaN(port) || port < 1 || port > 65535) {
                    return 'Please enter a valid port number (1-65535)';
                }
                return null;
            }
        });
        if (!portInput) {
            return; // User cancelled
        }
        const port = parseInt(portInput);
        // Start the proxy server
        try {
            proxyServer = new proxyServer_1.ProxyServer(port, (log) => {
                // Add log to our collection
                requestLogs.push(log);
                // Update webview if it's open
                if (logsPanel) {
                    logsPanel.webview.postMessage({
                        command: 'addLog',
                        log: log
                    });
                }
            });
            await proxyServer.start();
            vscode.window.showInformationMessage(`Proxy server started on port ${port}. Configure your app to use http://localhost:${port} as proxy.`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Failed to start proxy server: ${errorMessage}`);
            proxyServer = null;
        }
    });
    // Command 2: Show Logs Panel
    const showLogsCommand = vscode.commands.registerCommand('mirror-api.showLogs', () => {
        if (logsPanel) {
            // If panel already exists, reveal it
            logsPanel.reveal(vscode.ViewColumn.One);
        }
        else {
            // Create new webview panel
            logsPanel = vscode.window.createWebviewPanel('mirrorApiLogs', 'Mirror API Logs', vscode.ViewColumn.One, {
                enableScripts: true,
                retainContextWhenHidden: true
            });
            // Set webview content
            logsPanel.webview.html = getWebviewContent(context, logsPanel.webview);
            // Handle panel disposal
            logsPanel.onDidDispose(() => {
                logsPanel = null;
            }, null, context.subscriptions);
            // Handle messages from webview
            logsPanel.webview.onDidReceiveMessage(message => {
                if (message.command === 'clearLogs') {
                    requestLogs = [];
                    if (proxyServer) {
                        proxyServer.clearLogs();
                    }
                }
            }, undefined, context.subscriptions);
            // Send existing logs to webview
            if (requestLogs.length > 0) {
                // Small delay to ensure webview is ready
                setTimeout(() => {
                    requestLogs.forEach(log => {
                        logsPanel?.webview.postMessage({
                            command: 'addLog',
                            log: log
                        });
                    });
                }, 100);
            }
        }
    });
    context.subscriptions.push(startProxyCommand, showLogsCommand);
}
function deactivate() {
    // Stop proxy server when extension is deactivated
    if (proxyServer) {
        stopProxyServer();
    }
}
async function stopProxyServer() {
    if (proxyServer) {
        await proxyServer.stop();
        proxyServer = null;
    }
}
function getWebviewContent(context, webview) {
    let htmlPath = path.join(context.extensionPath, 'out', 'webview', 'index.html');
    if (!fs.existsSync(htmlPath)) {
        htmlPath = path.join(context.extensionPath, 'src', 'webview', 'index.html');
    }
    const html = fs.readFileSync(htmlPath, 'utf8');
    return html;
}
//# sourceMappingURL=extension.js.map