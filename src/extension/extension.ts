import * as vscode from 'vscode';
import { ExtPosition, WebviewMessage, ALL_SCALES } from '../common/types';
import { ChaoSize } from '../chao/chaoTypes';
import { ChaoTypes } from '../constants';

const DEFAULT_CHAO_SCALE = ChaoSize.medium;
const DEFAULT_POSITION = ExtPosition.panel;

let webviewViewProvider: ChaoWebviewViewProvider;

function getConfiguredSize(): ChaoSize {
    var size = vscode.workspace
        .getConfiguration('vscode-chao-garden')
        .get<ChaoSize>('chaoSize', DEFAULT_CHAO_SCALE);
    if (ALL_SCALES.lastIndexOf(size) === -1) {
        size = DEFAULT_CHAO_SCALE;
    }
    return size;
}

function getConfigurationPosition() {
    return vscode.workspace
        .getConfiguration('vscode-chao-garden')
        .get<ExtPosition>('position', DEFAULT_POSITION);
}

async function updateExtensionPositionContext() {
    await vscode.commands.executeCommand(
        'setContext',
        'vscode-chao-garden.position',
        getConfigurationPosition(),
    );
}

function getChaoPanel(): IChaoPanel | undefined {
    if (
        getConfigurationPosition() === ExtPosition.explorer &&
        webviewViewProvider
    ) {
        return webviewViewProvider;
    } else if (ChaoPanel.currentPanel) {
        return ChaoPanel.currentPanel;
    } else {
        return undefined;
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log(
        'Congratulations, the extension "vscode-chao-garden" is now active!',
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'vscode-chao-garden.start',
            async () => {
                if (
                    getConfigurationPosition() === ExtPosition.explorer &&
                    webviewViewProvider
                ) {
                    await vscode.commands.executeCommand('chaoView.focus');
                } else {
                    ChaoPanel.createOrShow(
                        context.extensionUri,
                        getConfiguredSize(),
                    );
                }
            },
        ),
    );

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(
            updateExtensionPositionContext,
        ),
    );

    webviewViewProvider = new ChaoWebviewViewProvider(context.extensionUri);
    updateExtensionPositionContext().catch((e) => {
        console.error(e);
    });

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            ChaoWebviewViewProvider.viewType,
            webviewViewProvider,
        ),
    );

    // Listening to configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(
            (e: vscode.ConfigurationChangeEvent): void => {
                if (e.affectsConfiguration('vscode-chao-garden.chaoSize')) {
                    const panel = getChaoPanel();
                    if (panel) {
                        panel.getWebview().postMessage({
                            command: 'updateGifSize',
                            gifSize: getConfiguredSize(),
                        });
                    }
                }

                if (e.affectsConfiguration('vscode-chao-garden.position')) {
                    void updateExtensionPositionContext();
                }
            },
        ),
    );

    if (vscode.window.registerWebviewPanelSerializer) {
        // Make sure we register a serializer in activation event
        vscode.window.registerWebviewPanelSerializer(ChaoPanel.viewType, {
            async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel) {
                // Reset the webview options so we use latest uri for `localResourceRoots`.
                webviewPanel.webview.options = getWebviewOptions(
                    context.extensionUri,
                );
                ChaoPanel.revive(
                    webviewPanel,
                    context.extensionUri,
                    getConfiguredSize(),
                );
            },
        });
    }

    // Register additional commands for menu actions
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'vscode-chao-garden.spawnSpecificChao',
            async () => {
                const chaoTypeOptions = Object.values(ChaoTypes).map(
                    (chaoType) => ({
                        label: chaoType.label,
                        value: chaoType.value,
                    }),
                );

                const selectedOption = await vscode.window.showQuickPick(
                    chaoTypeOptions,
                    {
                        placeHolder: 'Select a chao type to spawn',
                    },
                );

                if (!selectedOption) {
                    return; // User cancelled the quick pick
                }

                // Send message to webview to spawn a specific chao
                vscode.window
                    .showInputBox({
                        prompt: `Enter a name for the new ${selectedOption.label} chao`,
                        placeHolder: 'e.g. Leo',
                    })
                    .then((name) => {
                        const panel = getChaoPanel();
                        if (panel) {
                            panel.getWebview().postMessage({
                                command: 'spawnSpecificChao',
                                name: name,
                                chaoType: selectedOption?.value,
                            });
                        } else {
                            vscode.window.showErrorMessage(
                                'Chao panel not found.',
                            );
                        }
                    });
            },
        ),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'vscode-chao-garden.spawnRandomChao',
            async () => {
                vscode.window
                    .showInputBox({
                        prompt: 'Enter a name for the new chao',
                        placeHolder: 'e.g. Poppy',
                    })
                    .then((name) => {
                        // send a message
                        const panel = getChaoPanel();
                        if (panel) {
                            panel.getWebview().postMessage({
                                command: 'spawnRandomChao',
                                name: name,
                            });
                        } else {
                            vscode.window.showErrorMessage(
                                'Chao panel not found.',
                            );
                        }
                    });
            },
        ),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'vscode-chao-garden.deleteChao',
            async () => {
                // Request active chao list from webview
                const panel = getChaoPanel();
                if (panel) {
                    // Listen for response from webview
                    const disposable = panel
                        .getWebview()
                        .onDidReceiveMessage((message) => {
                            if (message.command === 'activeChaoList') {
                                // Prompt user to select which chao to delete
                                if (
                                    message.chaoList &&
                                    message.chaoList.length > 0
                                ) {
                                    type ChaoQuickPickItem = {
                                        label: string;
                                        description: string;
                                        id: string;
                                    };
                                    const quickPickItems: ChaoQuickPickItem[] =
                                        message.chaoList.map(
                                            (chao: {
                                                id: string;
                                                chaoType: string;
                                                name: string | null;
                                            }) => ({
                                                label: chao.name
                                                    ? chao.name
                                                    : 'Unnamed',
                                                description: chao.chaoType,
                                                id: chao.id,
                                            }),
                                        );
                                    vscode.window
                                        .showQuickPick<ChaoQuickPickItem>(
                                            quickPickItems,
                                            {
                                                placeHolder:
                                                    'Select a chao to delete',
                                            },
                                        )
                                        .then(
                                            (
                                                selected:
                                                    | ChaoQuickPickItem
                                                    | undefined,
                                            ) => {
                                                if (selected) {
                                                    panel
                                                        .getWebview()
                                                        .postMessage({
                                                            command:
                                                                'deleteChao',
                                                            chaoId: selected.id,
                                                        });
                                                }
                                            },
                                        );
                                } else {
                                    vscode.window.showWarningMessage(
                                        'No chao to delete.',
                                    );
                                }
                                disposable.dispose();
                            }
                        });
                    // Request the active chao list
                    panel
                        .getWebview()
                        .postMessage({ command: 'getActiveChaoList' });
                } else {
                    vscode.window.showErrorMessage('Chao panel not found.');
                }
            },
        ),
    );
}

function getWebviewOptions(
    extensionUri: vscode.Uri,
): vscode.WebviewOptions & vscode.WebviewPanelOptions {
    return {
        // Enable javascript in the webview
        enableScripts: true,
        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
    };
}

interface IChaoPanel {
    update(): void;
    getWebview(): vscode.Webview;
}

class ChaoWebviewContainer implements IChaoPanel {
    protected _extensionUri: vscode.Uri;
    protected _disposables: vscode.Disposable[] = [];

    constructor(extensionUri: vscode.Uri) {
        this._extensionUri = extensionUri;
    }

    public getWebview(): vscode.Webview {
        throw new Error('Not implemented');
    }

    protected _update() {
        const webview = this.getWebview();
        webview.html = this._getHtmlForWebview(webview);
    }

    public update() {}

    protected _getHtmlForWebview(webview: vscode.Webview) {
        // Local path to main script run in the webview
        const scriptPathOnDisk = vscode.Uri.joinPath(
            this._extensionUri,
            'media',
            'main-bundle.js',
        );

        // And the uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

        // Local path to css styles
        const styleResetPath = vscode.Uri.joinPath(
            this._extensionUri,
            'media',
            'reset.css',
        );
        const stylesPathMainPath = vscode.Uri.joinPath(
            this._extensionUri,
            'media',
            'chao.css',
        );
        const silkScreenFontPath = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this._extensionUri,
                'media',
                'Silkscreen-Regular.ttf',
            ),
        );

        // Uri to load styles into webview
        const stylesResetUri = webview.asWebviewUri(styleResetPath);
        const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);

        // Get path to resource on disk
        const baseChaoUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media'),
        );

        // const chaoTypeUris = createChaoTypeUris(webview, this._extensionUri);

        // Use a nonce to only allow specific scripts to be run
        const nonce = getNonce();

        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'nonce-${nonce}'; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';
                font-src ${webview.cspSource};">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${stylesResetUri}" rel="stylesheet" nonce="${nonce}">
				<link href="${stylesMainUri}" rel="stylesheet" nonce="${nonce}">
                <style nonce="${nonce}">
                @font-face {
                    font-family: 'silkscreen';
                    src: url('${silkScreenFontPath}') format('truetype');
                }
                </style>
				<title>VS Code Chao Garden</title>
			</head>
			<body>
                <canvas id="chaoCanvas"></canvas>
                <div id="chaoContainer"></div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
                <script nonce="${nonce}">
                    chaoGardenApp.chaoPanelApp(
                        "${baseChaoUri}",
                        "${getConfiguredSize()}"
                    );
                </script>
            </body>
			</html>`;
    }
}

function handleWebviewMessage(message: WebviewMessage) {
    switch (message.command) {
        case 'alert':
            void vscode.window.showErrorMessage(message.text);
            return;
        case 'info':
            void vscode.window.showInformationMessage(message.text);
            return;
        case 'vscodeShowWarningMessage':
            void vscode.window.showWarningMessage(message.text);
            return;
    }
}

/**
 * Manages chao coding webview panels
 */
class ChaoPanel extends ChaoWebviewContainer implements IChaoPanel {
    /**
     * Track the currently panel. Only allow a single panel to exist at a time.
     */
    public static currentPanel: ChaoPanel | undefined;

    public static readonly viewType = 'chaoGardenCoding';

    public readonly _panel: vscode.WebviewPanel;

    public static createOrShow(extensionUri: vscode.Uri, chaoSize: ChaoSize) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // If we already have a panel, show it.
        if (ChaoPanel.currentPanel) {
            ChaoPanel.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            ChaoPanel.viewType,
            'Chao Panel',
            vscode.ViewColumn.Two,
            getWebviewOptions(extensionUri),
        );

        ChaoPanel.currentPanel = new ChaoPanel(panel, extensionUri, chaoSize);
    }

    public static revive(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        chaoSize: ChaoSize,
    ) {
        ChaoPanel.currentPanel = new ChaoPanel(panel, extensionUri, chaoSize);
    }

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        size: ChaoSize,
    ) {
        super(extensionUri);

        this._panel = panel;

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content based on view changes
        this._panel.onDidChangeViewState(
            () => {
                this.update();
            },
            null,
            this._disposables,
        );

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            handleWebviewMessage,
            null,
            this._disposables,
        );
    }

    public dispose() {
        ChaoPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    public update() {
        if (this._panel.visible) {
            this._update();
        }
    }

    getWebview(): vscode.Webview {
        return this._panel.webview;
    }
}

class ChaoWebviewViewProvider extends ChaoWebviewContainer {
    public static readonly viewType = 'chaoView';

    private _webviewView?: vscode.WebviewView;

    resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
        this._webviewView = webviewView;

        webviewView.webview.options = getWebviewOptions(this._extensionUri);
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(
            handleWebviewMessage,
            null,
            this._disposables,
        );
    }

    update() {
        this._update();
    }

    getWebview(): vscode.Webview {
        if (this._webviewView === undefined) {
            throw new Error(
                vscode.l10n.t(
                    'Panel not active, make sure the chao garden view is visible before running this command.',
                ),
            );
        } else {
            return this._webviewView.webview;
        }
    }
}

function getNonce() {
    let text = '';
    const possible =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
