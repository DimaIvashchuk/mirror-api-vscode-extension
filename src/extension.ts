import * as vscode from 'vscode';
import { ProxyServer, RequestLog } from './proxyServer';
import * as path from 'path';
import * as fs from 'fs';

let proxyServer: ProxyServer | null = null;
let logsPanel: vscode.WebviewPanel | null = null;
let requestLogs: RequestLog[] = [];

export function activate(context: vscode.ExtensionContext) {
    console.log('Mirror API extension is now active!');

    // Command 1: Start Proxy Server
    const startProxyCommand = vscode.commands.registerCommand('mirror-api.startProxy', async () => {
        // If proxy is already running, ask to stop it first
        if (proxyServer) {
            const action = await vscode.window.showWarningMessage(
                `Proxy server is already running on port ${proxyServer.getPort()}`,
                'Stop Server',
                'Cancel'
            );
            
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
            proxyServer = new ProxyServer(port, (log) => {
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
            
            vscode.window.showInformationMessage(
                `Proxy server started on port ${port}. Configure your app to use http://localhost:${port} as proxy.`
            );
        } catch (error) {
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
        } else {
            // Create new webview panel
            logsPanel = vscode.window.createWebviewPanel(
                'mirrorApiLogs',
                'Mirror API Logs',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            // Set webview content
            logsPanel.webview.html = getWebviewContent(context, logsPanel.webview);

            // Handle panel disposal
            logsPanel.onDidDispose(() => {
                logsPanel = null;
            }, null, context.subscriptions);

            // Handle messages from webview
            logsPanel.webview.onDidReceiveMessage(
                message => {
                    if (message.command === 'clearLogs') {
                        requestLogs = [];
                        if (proxyServer) {
                            proxyServer.clearLogs();
                        }
                    }
                },
                undefined,
                context.subscriptions
            );

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

export function deactivate() {
    // Stop proxy server when extension is deactivated
    if (proxyServer) {
        stopProxyServer();
    }
}

async function stopProxyServer(): Promise<void> {
    if (proxyServer) {
        await proxyServer.stop();
        proxyServer = null;
    }
}

function getWebviewContent(context: vscode.ExtensionContext, webview: vscode.Webview): string {
	let htmlPath = path.join(context.extensionPath, 'out', 'webview', 'index.html');
	
	if (!fs.existsSync(htmlPath)) {
		htmlPath = path.join(context.extensionPath, 'src', 'webview', 'index.html');
	}
    const html = fs.readFileSync(htmlPath, 'utf8');
    return html;
}
