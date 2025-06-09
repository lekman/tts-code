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

/**
 * Converts markdown text to plain text suitable for TTS
 * @param {string} markdown The markdown text to convert
 * @param {boolean} includeCodeBlocks Whether to include code blocks in the output
 * @returns {string} Plain text suitable for TTS
 */
export function markdownToPlainText(
	markdown: string,
	includeCodeBlocks: boolean = false
): string {
	let text = markdown;

	// Remove code blocks first (if not including them)
	if (!includeCodeBlocks) {
		// Remove fenced code blocks
		text = text.replace(/```[\s\S]*?```/g, "");
		// Remove indented code blocks (4 spaces or 1 tab)
		text = text.replace(/^(?: {4}|\t).*$/gm, "");
	} else {
		// Replace code blocks with descriptions
		text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang) => {
			return `[Code block${lang ? ` in ${lang}` : ""}] `;
		});
	}

	// Remove HTML tags - apply repeatedly until no more changes occur
	// This prevents nested tags from reappearing after initial removal
	let previousText;
	do {
		previousText = text;
		// First remove complete tags
		text = text.replace(/<[^>]*>/g, "");
		// Then remove any remaining angle brackets
		text = text.replace(/[<>]/g, "");
	} while (text !== previousText);

	// Convert headers to plain text (remove # symbols)
	text = text.replace(/^#{1,6}\s+(.+)$/gm, "$1.");

	// Convert emphasis (bold, italic, strikethrough)
	text = text.replace(/\*\*\*(.+?)\*\*\*/g, "$1"); // Bold italic
	text = text.replace(/\*\*(.+?)\*\*/g, "$1"); // Bold
	text = text.replace(/\*(.+?)\*/g, "$1"); // Italic
	text = text.replace(/__(.+?)__/g, "$1"); // Bold
	text = text.replace(/_(.+?)_/g, "$1"); // Italic
	text = text.replace(/~~(.+?)~~/g, "$1"); // Strikethrough

	// Convert images to descriptions (must be before links)
	text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, (match, alt) => {
		return `Image: ${alt || "untitled"}.`;
	});

	// Convert links to just the text
	text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
	// Reference style links
	text = text.replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1");
	// Link definitions
	text = text.replace(/^\[[^\]]+\]:\s+.+$/gm, "");

	// Convert inline code
	text = text.replace(/`([^`]+)`/g, "$1");

	// Convert lists
	text = text.replace(/^[*\-+]\s+(.+)$/gm, "• $1");
	text = text.replace(/^\d+\.\s+(.+)$/gm, "• $1");

	// Convert blockquotes
	text = text.replace(/^>\s+(.+)$/gm, "$1");

	// Remove horizontal rules
	text = text.replace(/^[*\-_]{3,}$/gm, "");

	// Remove extra blank lines
	text = text.replace(/\n{3,}/g, "\n\n");

	// Clean up extra spaces
	text = text.replace(/[ \t]+/g, " ");
	text = text.replace(/^ +/gm, "");
	text = text.replace(/ +$/gm, "");

	// Final trim
	text = text.trim();

	return text;
}

/**
 * Determines if a file is markdown based on its extension
 * @param {string} fileName The file name or path
 * @returns {boolean} True if the file is markdown
 */
export function isMarkdownFile(fileName: string): boolean {
	if (!fileName) return false;
	const markdownExtensions = [".md", ".markdown", ".mdown", ".mkd", ".mdx"];
	const lowerFileName = fileName.toLowerCase();
	return markdownExtensions.some((ext) => lowerFileName.endsWith(ext));
}
