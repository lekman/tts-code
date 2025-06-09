/**
 * ElevenLabs Text-to-Speech for VSCode
 * Copyright(C) 2025 Tobias Lekman
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 * For feature requests, and FAQs, please visit:
 * https://github.com/lekman/tts-code
 */

import * as vscode from "vscode";

/**
 * Message types for webview communication
 */
export interface WebviewMessage {
	type: string;
	data?: string;
	position?: number;
	duration?: number;
	error?: string;
	format?: string;
}

/**
 * Provides a webview panel for playback controls and TTS UI in the extension.
 */
export class WebviewProvider implements vscode.WebviewViewProvider {
	/**
	 * The unique view type identifier for the webview.
	 */
	public static readonly viewType = "ttsCode.webview";

	private _onDidReceiveMessage = new vscode.EventEmitter<WebviewMessage>();
	/**
	 * Event that fires when the webview sends a message
	 */
	public readonly onDidReceiveMessage = this._onDidReceiveMessage.event;

	private _view?: vscode.WebviewView;

	/**
	 * Creates a new WebviewProvider instance.
	 * @param {vscode.ExtensionContext} _context - The VSCode extension context for resource management.
	 */
	constructor(private readonly _context: vscode.ExtensionContext) {}

	/**
	 * Disposes of the webview provider and cleans up resources.
	 * @returns {void}
	 */
	public dispose(): void {
		this._onDidReceiveMessage.dispose();
		this._view = undefined;
	}

	/**
	 * Posts a message to the webview.
	 * @param {WebviewMessage} message - The message to send.
	 * @returns {void}
	 */
	public postMessage(message: WebviewMessage): void {
		if (this._view) {
			this._view.webview.postMessage(message);
		}
	}

	/**
	 * Resolves and displays the webview view with playback controls UI.
	 * @param {vscode.WebviewView} webviewView - The webview view instance to populate.
	 * @param {vscode.WebviewViewResolveContext} _context - The resolve context for the webview view.
	 * @param {vscode.CancellationToken} _token - Cancellation token for the resolve operation.
	 * @returns {void}
	 */
	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	): void {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._context.extensionUri],
		};

		webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

		// Handle messages from the webview
		webviewView.webview.onDidReceiveMessage(
			(message) => {
				this._onDidReceiveMessage.fire(message);
			},
			null,
			this._context.subscriptions
		);
	}

	/**
	 * Returns the HTML content for the playback controls webview.
	 * @param {vscode.Webview} webview - The webview instance.
	 * @returns {string} The HTML string for the webview UI.
	 */
	private getHtmlForWebview(webview: vscode.Webview): string {
		// Use a nonce to only allow specific scripts to run
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; media-src data: blob:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
				<title>TTS Playback Controls</title>
				<style>
					body {
						padding: 10px;
						font-family: var(--vscode-font-family);
						font-size: var(--vscode-font-size);
						color: var(--vscode-foreground);
						background-color: var(--vscode-editor-background);
					}
					.controls {
						display: flex;
						align-items: center;
						gap: 10px;
						margin-bottom: 10px;
					}
					button {
						background-color: var(--vscode-button-background);
						color: var(--vscode-button-foreground);
						border: none;
						padding: 8px 16px;
						cursor: pointer;
						border-radius: 2px;
						font-size: 14px;
						min-width: 100px;
					}
					button:hover:not(:disabled) {
						background-color: var(--vscode-button-hoverBackground);
					}
					button:disabled {
						opacity: 0.5;
						cursor: not-allowed;
					}
					.progress-container {
						width: 100%;
						margin: 10px 0;
					}
					#progressBar {
						width: 100%;
						height: 5px;
						cursor: pointer;
					}
					.time-display {
						display: flex;
						justify-content: space-between;
						font-size: 12px;
						color: var(--vscode-descriptionForeground);
					}
					.status {
						margin-top: 10px;
						font-size: 12px;
						color: var(--vscode-descriptionForeground);
					}
					audio {
						display: none;
					}
					h3 {
						margin-bottom: 15px;
					}
				</style>
			</head>
			<body>
				<h3>TTS Playback</h3>
				
				<audio id="audioPlayer"></audio>
				
				<div class="controls">
					<button id="playPauseBtn" disabled>▶️ Play</button>
				</div>
				
				<div class="progress-container">
					<input type="range" id="progressBar" min="0" max="100" value="0" disabled>
					<div class="time-display">
						<span id="currentTime">0:00</span>
						<span id="duration">0:00</span>
					</div>
				</div>
				
				<div class="status" id="status">Ready</div>
				
				<script nonce="${nonce}">
					const vscode = acquireVsCodeApi();
					const audioPlayer = document.getElementById('audioPlayer');
					const playPauseBtn = document.getElementById('playPauseBtn');
					const progressBar = document.getElementById('progressBar');
					const currentTimeSpan = document.getElementById('currentTime');
					const durationSpan = document.getElementById('duration');
					const statusDiv = document.getElementById('status');
					
					let isLoaded = false;
					
					// Format time in mm:ss
					function formatTime(seconds) {
						const mins = Math.floor(seconds / 60);
						const secs = Math.floor(seconds % 60);
						return mins + ':' + secs.toString().padStart(2, '0');
					}
					
					// Clear the player
					function clearPlayer() {
						if (audioPlayer.src && audioPlayer.src.startsWith('blob:')) {
							URL.revokeObjectURL(audioPlayer.src);
						}
						audioPlayer.src = '';
						isLoaded = false;
						currentTimeSpan.textContent = '0:00';
						durationSpan.textContent = '0:00';
						progressBar.value = 0;
						progressBar.disabled = true;
						playPauseBtn.disabled = true;
						playPauseBtn.textContent = '▶️ Play';
						statusDiv.textContent = 'Waiting for audio...';
					}
					
					// Update UI state
					function updateUI() {
						if (!isLoaded || !audioPlayer.src) {
							playPauseBtn.disabled = true;
							progressBar.disabled = true;
							return;
						}
						
						const isPaused = audioPlayer.paused;
						playPauseBtn.disabled = false;
						playPauseBtn.textContent = isPaused ? '▶️ Play' : '⏸️ Pause';
						progressBar.disabled = false;
						
						if (!isNaN(audioPlayer.duration)) {
							currentTimeSpan.textContent = formatTime(audioPlayer.currentTime);
							durationSpan.textContent = formatTime(audioPlayer.duration);
							progressBar.value = (audioPlayer.currentTime / audioPlayer.duration) * 100 || 0;
						}
					}
					
					// Handle messages from extension
					window.addEventListener('message', event => {
						const message = event.data;
						
						switch (message.type) {
							case 'clearAudio':
								clearPlayer();
								break;
								
							case 'loadAudio':
								clearPlayer();
								statusDiv.textContent = 'Loading audio...';
								
								try {
									const blob = new Blob(
										[Uint8Array.from(atob(message.data), c => c.charCodeAt(0))],
										{ type: 'audio/mpeg' }
									);
									const url = URL.createObjectURL(blob);
									audioPlayer.src = url;
									audioPlayer.load();
								} catch (err) {
									statusDiv.textContent = 'Error decoding audio';
									console.error('Audio decode error:', err);
									isLoaded = false;
									updateUI();
								}
								break;
								
							case 'play':
								if (isLoaded && audioPlayer.paused) {
									audioPlayer.play().catch(err => {
										console.error('Play error:', err);
									});
								}
								break;
								
							case 'pause':
								audioPlayer.pause();
								break;
								
							case 'stop':
								audioPlayer.pause();
								audioPlayer.currentTime = 0;
								updateUI();
								break;
						}
					});
					
					// Audio player events
					audioPlayer.addEventListener('loadeddata', () => {
						isLoaded = true;
						statusDiv.textContent = 'Playing...';
						updateUI();
						
						// Auto-play when audio is loaded
						audioPlayer.play().then(() => {
							console.log('Auto-play started');
							vscode.postMessage({ type: 'playing' });
						}).catch(err => {
							console.error('Auto-play failed:', err);
							statusDiv.textContent = 'Ready - click Play to start';
						});
					});
					
					audioPlayer.addEventListener('play', () => {
						statusDiv.textContent = 'Playing';
						updateUI();
						vscode.postMessage({ type: 'playing' });
					});
					
					audioPlayer.addEventListener('pause', () => {
						statusDiv.textContent = audioPlayer.currentTime === 0 ? 'Stopped' : 'Paused';
						updateUI();
						vscode.postMessage({ type: 'paused' });
					});
					
					audioPlayer.addEventListener('ended', () => {
						statusDiv.textContent = 'Finished';
						audioPlayer.currentTime = 0;
						updateUI();
						vscode.postMessage({ type: 'ended' });
					});
					
					audioPlayer.addEventListener('timeupdate', () => {
						updateUI();
						vscode.postMessage({ 
							type: 'timeUpdate',
							position: audioPlayer.currentTime
						});
					});
					
					audioPlayer.addEventListener('error', (e) => {
						isLoaded = false;
						statusDiv.textContent = 'Error loading audio';
						console.error('Audio error:', e);
						updateUI();
						vscode.postMessage({ 
							type: 'error',
							error: e.message || 'Unknown error'
						});
					});
					
					// Play/Pause button handler
					playPauseBtn.addEventListener('click', () => {
						if (audioPlayer.paused) {
							audioPlayer.play().catch(err => {
								console.error('Play button error:', err);
								statusDiv.textContent = 'Playback failed';
							});
						} else {
							audioPlayer.pause();
						}
					});
					
					// Progress bar handler
					progressBar.addEventListener('input', () => {
						const time = (progressBar.value / 100) * audioPlayer.duration;
						audioPlayer.currentTime = time;
						vscode.postMessage({ 
							type: 'seeked',
							position: time
						});
					});
					
					// Initial UI state
					clearPlayer();
					
					// Send ready message
					vscode.postMessage({ type: 'ready' });
				</script>
			</body>
			</html>`;
	}
}

/**
 * Generates a random nonce for content security policy.
 * @returns {string} A random nonce string.
 */
function getNonce(): string {
	let text = "";
	const possible =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
