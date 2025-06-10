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

import { AudioManager } from "./audioManager";
import { HighlightManager } from "./highlightManager";

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
	 * @param {AudioManager} audioManager - The audio manager instance for audio operations.
	 * @param {HighlightManager} highlightManager - The highlight manager instance for text highlighting.
	 */
	constructor(
		private readonly _context: vscode.ExtensionContext,
		private readonly audioManager: AudioManager,
		private readonly highlightManager: HighlightManager
	) {}

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
					
					/* Focus styles for keyboard navigation */
					*:focus {
						outline: 2px solid var(--vscode-focusBorder);
						outline-offset: 2px;
					}
					
					.player-container {
						display: flex;
						flex-direction: column;
						gap: 15px;
					}
					
					.player-section {
						margin-bottom: 20px;
						padding-bottom: 20px;
						border-bottom: 1px solid var(--vscode-widget-border);
					}
					
					.controls-section {
						margin-bottom: 20px;
					}
					
					.controls-group {
						display: flex;
						align-items: center;
						gap: 8px;
						margin-bottom: 15px;
						flex-wrap: wrap;
					}
					
					.section-title {
						font-size: 11px;
						font-weight: 600;
						text-transform: uppercase;
						color: var(--vscode-descriptionForeground);
						margin-bottom: 8px;
						letter-spacing: 0.5px;
					}
					
					button {
						background-color: var(--vscode-button-background);
						color: var(--vscode-button-foreground);
						border: none;
						padding: 6px 12px;
						cursor: pointer;
						border-radius: 2px;
						font-size: 13px;
						display: inline-flex;
						align-items: center;
						gap: 4px;
					}
					
					button:hover:not(:disabled) {
						background-color: var(--vscode-button-hoverBackground);
					}
					
					button:disabled {
						opacity: 0.5;
						cursor: not-allowed;
					}
					
					button.primary {
						min-width: 100px;
						justify-content: center;
					}
					
					button.secondary {
						background-color: var(--vscode-button-secondaryBackground);
						color: var(--vscode-button-secondaryForeground);
					}
					
					button.secondary:hover:not(:disabled) {
						background-color: var(--vscode-button-secondaryHoverBackground);
					}
					
					.progress-container {
						width: 100%;
						margin: 10px 0;
						position: relative;
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
						margin-top: 5px;
					}
					
					.status {
						margin-top: 10px;
						font-size: 12px;
						color: var(--vscode-descriptionForeground);
					}
					
					.export-section {
						margin-top: 20px;
						padding-top: 20px;
						border-top: 1px solid var(--vscode-widget-border);
					}
					
					audio {
						display: none;
					}
					
					h1 {
						font-size: 1.2em;
						margin-bottom: 15px;
					}
					
					/* High contrast theme support */
					@media (prefers-contrast: high) {
						button {
							border: 1px solid var(--vscode-button-foreground);
						}
						
						.progress-container {
							border: 1px solid var(--vscode-foreground);
						}
						
						#progressBar {
							border: 1px solid var(--vscode-foreground);
						}
					}
					
					/* Additional high contrast support using VS Code's forced colors */
					@media (forced-colors: active) {
						button {
							border: 1px solid ButtonText;
						}
						
						.progress-container {
							border: 1px solid ButtonText;
						}
						
						#progressBar {
							forced-color-adjust: none;
							accent-color: Highlight;
						}
					}
					
					/* Skip link for screen readers */
					.skip-link {
						position: absolute;
						left: -9999px;
						top: 0;
						z-index: 999;
					}
					
					.skip-link:focus {
						left: 10px;
						top: 10px;
						background: var(--vscode-button-background);
						color: var(--vscode-button-foreground);
						padding: 8px;
						text-decoration: none;
						border-radius: 2px;
					}
				</style>
			</head>
			<body>
				<a href="#main-controls" class="skip-link">Skip to main controls</a>
				
				<div class="player-container" role="application" aria-label="Text-to-Speech Player">
					<h1 id="title" tabindex="-1">Text-to-Speech Player</h1>
					
					<audio id="audioPlayer" aria-label="Audio player"></audio>
					
					<!-- Player Section -->
					<div class="player-section">
						<div class="progress-container" 
						     role="slider" 
						     aria-label="Playback progress" 
						     aria-valuemin="0" 
						     aria-valuemax="100" 
						     aria-valuenow="0"
						     aria-valuetext="0 seconds of 0 seconds">
							<input type="range" 
							       id="progressBar" 
							       min="0" 
							       max="100" 
							       value="0" 
							       disabled
							       aria-label="Seek slider"
							       tabindex="0">
							<div class="time-display">
								<span id="currentTime" aria-label="Current time">0:00</span>
								<span id="duration" aria-label="Total duration">0:00</span>
							</div>
						</div>
						<div class="status" id="status" role="status" aria-live="polite" aria-atomic="true">
							Waiting for audio...
						</div>
					</div>
					
					<!-- Controls Section -->
					<div class="controls-section" id="main-controls">
						<div class="section-title" id="playback-controls-label">Playback Controls</div>
						<div class="controls-group" role="toolbar" aria-labelledby="playback-controls-label">
							<button id="playPauseBtn" 
							        class="primary" 
							        disabled 
							        aria-label="Play"
							        tabindex="0">
								<span aria-hidden="true">▶️</span> Play
							</button>
							<button id="stopBtn" 
							        disabled 
							        aria-label="Stop playback"
							        tabindex="0">
								<span aria-hidden="true">⏹️</span> Stop
							</button>
							<button id="skipBackBtn" 
							        disabled 
							        aria-label="Skip backward 10 seconds"
							        tabindex="0">
								<span aria-hidden="true">⏪</span> -10s
							</button>
							<button id="skipForwardBtn" 
							        disabled 
							        aria-label="Skip forward 10 seconds"
							        tabindex="0">
								<span aria-hidden="true">⏩</span> +10s
							</button>
						</div>
					</div>
					
					<!-- Export Section -->
					<div class="export-section">
						<div class="section-title" id="export-options-label">Export Options</div>
						<div class="controls-group" role="toolbar" aria-labelledby="export-options-label">
							<button id="exportMp3Btn" 
							        class="secondary" 
							        disabled 
							        aria-label="Export as MP3 file"
							        tabindex="0">
								<span aria-hidden="true">💾</span> Export MP3
							</button>
							<button id="exportWavBtn" 
							        class="secondary" 
							        disabled 
							        aria-label="Export as WAV file"
							        tabindex="0">
								<span aria-hidden="true">💾</span> Export WAV
							</button>
						</div>
					</div>
				</div>
				
				<script nonce="${nonce}">
					const vscode = acquireVsCodeApi();
					const audioPlayer = document.getElementById('audioPlayer');
					const playPauseBtn = document.getElementById('playPauseBtn');
					const stopBtn = document.getElementById('stopBtn');
					const skipBackBtn = document.getElementById('skipBackBtn');
					const skipForwardBtn = document.getElementById('skipForwardBtn');
					const exportMp3Btn = document.getElementById('exportMp3Btn');
					const exportWavBtn = document.getElementById('exportWavBtn');
					const progressBar = document.getElementById('progressBar');
					const progressContainer = document.querySelector('.progress-container');
					const currentTimeSpan = document.getElementById('currentTime');
					const durationSpan = document.getElementById('duration');
					const statusDiv = document.getElementById('status');
					
					let isLoaded = false;
					let shouldAutoPlay = false;
					
					// Format time in mm:ss
					function formatTime(seconds) {
						const mins = Math.floor(seconds / 60);
						const secs = Math.floor(seconds % 60);
						return mins + ':' + secs.toString().padStart(2, '0');
					}
					
					// Update ARIA attributes for progress
					function updateProgressAria() {
						if (!isNaN(audioPlayer.duration) && audioPlayer.duration > 0) {
							const percent = Math.round((audioPlayer.currentTime / audioPlayer.duration) * 100);
							const currentFormatted = formatTime(audioPlayer.currentTime);
							const durationFormatted = formatTime(audioPlayer.duration);
							
							progressContainer.setAttribute('aria-valuenow', percent);
							progressContainer.setAttribute('aria-valuetext', 
								currentFormatted + ' of ' + durationFormatted);
						}
					}
					
					// Announce status to screen readers
					function announceStatus(message) {
						statusDiv.textContent = message;
						// Force screen reader to announce by toggling aria-live
						statusDiv.setAttribute('aria-live', 'off');
						setTimeout(() => {
							statusDiv.setAttribute('aria-live', 'polite');
						}, 100);
					}
					
					// Clear the player
					function clearPlayer() {
						if (audioPlayer.src && audioPlayer.src.startsWith('blob:')) {
							URL.revokeObjectURL(audioPlayer.src);
						}
						audioPlayer.src = '';
						isLoaded = false;
						shouldAutoPlay = false;
						currentTimeSpan.textContent = '0:00';
						durationSpan.textContent = '0:00';
						progressBar.value = 0;
						progressBar.disabled = true;
						playPauseBtn.disabled = true;
						playPauseBtn.textContent = '▶️ Play';
						playPauseBtn.setAttribute('aria-label', 'Play');
						stopBtn.disabled = true;
						skipBackBtn.disabled = true;
						skipForwardBtn.disabled = true;
						exportMp3Btn.disabled = true;
						exportWavBtn.disabled = true;
						announceStatus('Waiting for audio...');
						updateProgressAria();
					}
					
					// Update UI state
					function updateUI() {
						if (!isLoaded || !audioPlayer.src) {
							playPauseBtn.disabled = true;
							stopBtn.disabled = true;
							skipBackBtn.disabled = true;
							skipForwardBtn.disabled = true;
							exportMp3Btn.disabled = true;
							exportWavBtn.disabled = true;
							progressBar.disabled = true;
							return;
						}
						
						const isPaused = audioPlayer.paused;
						playPauseBtn.disabled = false;
						playPauseBtn.innerHTML = isPaused ? 
							'<span aria-hidden="true">▶️</span> Play' : 
							'<span aria-hidden="true">⏸️</span> Pause';
						playPauseBtn.setAttribute('aria-label', isPaused ? 'Play' : 'Pause');
						stopBtn.disabled = false;
						skipBackBtn.disabled = false;
						skipForwardBtn.disabled = false;
						exportMp3Btn.disabled = false;
						exportWavBtn.disabled = false;
						progressBar.disabled = false;
						
						if (!isNaN(audioPlayer.duration)) {
							currentTimeSpan.textContent = formatTime(audioPlayer.currentTime);
							durationSpan.textContent = formatTime(audioPlayer.duration);
							progressBar.value = (audioPlayer.currentTime / audioPlayer.duration) * 100 || 0;
							updateProgressAria();
						}
					}
					
					// Handle keyboard navigation
					document.addEventListener('keydown', (e) => {
						if (!audioPlayer || !isLoaded) return;
						
						// Don't interfere with button focus navigation
						if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') {
							// Allow space to activate buttons
							if (e.code === 'Space' && e.target.tagName === 'BUTTON') {
								e.preventDefault();
								e.target.click();
							}
							return;
						}
						
						switch(e.code) {
							case 'Space':
								e.preventDefault();
								playPauseBtn.click();
								break;
							case 'ArrowLeft':
								e.preventDefault();
								skipBackBtn.click();
								break;
							case 'ArrowRight':
								e.preventDefault();
								skipForwardBtn.click();
								break;
							case 'Home':
								e.preventDefault();
								audioPlayer.currentTime = 0;
								updateUI();
								announceStatus('Jumped to beginning');
								break;
							case 'End':
								e.preventDefault();
								if (!isNaN(audioPlayer.duration)) {
									audioPlayer.currentTime = audioPlayer.duration;
									updateUI();
									announceStatus('Jumped to end');
								}
								break;
						}
					});
					
					// Handle messages from extension
					window.addEventListener('message', event => {
						const message = event.data;
						
						switch (message.type) {
							case 'clearAudio':
								clearPlayer();
								break;
								
							case 'loadAudio':
								clearPlayer();
								announceStatus('Loading audio...');
								shouldAutoPlay = true; // Mark that we should auto-play
								
								try {
									const blob = new Blob(
										[Uint8Array.from(atob(message.data), c => c.charCodeAt(0))],
										{ type: 'audio/mpeg' }
									);
									const url = URL.createObjectURL(blob);
									audioPlayer.src = url;
									audioPlayer.load();
								} catch (err) {
									announceStatus('Error decoding audio');
									console.error('Audio decode error:', err);
									isLoaded = false;
									shouldAutoPlay = false;
									updateUI();
								}
								break;
								
							case 'play':
								if (isLoaded && audioPlayer.paused) {
									audioPlayer.play().catch(err => {
										console.error('Play error:', err);
										announceStatus('Playback failed');
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
						updateUI();
						
						// Auto-play when audio is loaded and shouldAutoPlay is true
						if (shouldAutoPlay) {
							shouldAutoPlay = false; // Reset flag
							announceStatus('Starting playback...');
							
							// Use setTimeout to ensure the audio element is ready
							setTimeout(() => {
								const playPromise = audioPlayer.play();
								
								if (playPromise !== undefined) {
									playPromise.then(() => {
										console.log('Auto-play started successfully');
										announceStatus('Playing');
									}).catch(err => {
										console.error('Auto-play failed:', err);
										announceStatus('Ready - click Play to start');
									});
								}
							}, 100);
						} else {
							announceStatus('Ready - click Play to start');
						}
					});
					
					audioPlayer.addEventListener('play', () => {
						announceStatus('Playing');
						updateUI();
						vscode.postMessage({ type: 'playing' });
					});
					
					audioPlayer.addEventListener('pause', () => {
						announceStatus(audioPlayer.currentTime === 0 ? 'Stopped' : 'Paused');
						updateUI();
						vscode.postMessage({ type: 'paused' });
					});
					
					audioPlayer.addEventListener('ended', () => {
						announceStatus('Playback finished');
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
						announceStatus('Error loading audio');
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
								announceStatus('Playback failed');
							});
						} else {
							audioPlayer.pause();
						}
					});
					
					// Stop button handler
					stopBtn.addEventListener('click', () => {
						audioPlayer.pause();
						audioPlayer.currentTime = 0;
						updateUI();
						vscode.postMessage({ type: 'stopped' });
						announceStatus('Stopped');
					});
					
					// Skip backward button handler
					skipBackBtn.addEventListener('click', () => {
						const newTime = Math.max(0, audioPlayer.currentTime - 10);
						audioPlayer.currentTime = newTime;
						updateUI();
						announceStatus('Skipped backward 10 seconds');
						vscode.postMessage({ 
							type: 'seeked',
							position: newTime
						});
					});
					
					// Skip forward button handler
					skipForwardBtn.addEventListener('click', () => {
						const newTime = Math.min(audioPlayer.duration || 0, audioPlayer.currentTime + 10);
						audioPlayer.currentTime = newTime;
						updateUI();
						announceStatus('Skipped forward 10 seconds');
						vscode.postMessage({ 
							type: 'seeked',
							position: newTime
						});
					});
					
					// Export MP3 button handler
					exportMp3Btn.addEventListener('click', () => {
						vscode.postMessage({ 
							type: 'export',
							format: 'mp3'
						});
						announceStatus('Exporting as MP3...');
					});
					
					// Export WAV button handler
					exportWavBtn.addEventListener('click', () => {
						vscode.postMessage({ 
							type: 'export',
							format: 'wav'
						});
						announceStatus('Exporting as WAV...');
					});
					
					// Progress bar handler
					progressBar.addEventListener('input', () => {
						const time = (progressBar.value / 100) * audioPlayer.duration;
						audioPlayer.currentTime = time;
						updateUI();
						vscode.postMessage({ 
							type: 'seeked',
							position: time
						});
					});
					
					// Progress bar keyboard support
					progressBar.addEventListener('keydown', (e) => {
						if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
							e.stopPropagation(); // Prevent global keyboard handler
						}
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
