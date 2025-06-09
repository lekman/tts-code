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

import { isMarkdownFile, markdownToPlainText } from "../src/markdownUtils";

describe("markdownUtils", () => {
	describe("markdownToPlainText", () => {
		it("should convert headers to plain text", () => {
			const markdown = "# Header 1\n## Header 2\n### Header 3";
			const result = markdownToPlainText(markdown);
			// Headers are on separate lines, so they remain on separate lines
			expect(result).toBe("Header 1.\nHeader 2.\nHeader 3.");
		});

		it("should remove markdown formatting", () => {
			const markdown = "**bold** *italic* ~~strikethrough~~";
			const result = markdownToPlainText(markdown);
			expect(result).toBe("bold italic strikethrough");
		});

		it("should handle links", () => {
			const markdown = "[Link text](https://example.com)";
			const result = markdownToPlainText(markdown);
			expect(result).toBe("Link text");
		});

		it("should handle images", () => {
			const markdown = "![Alt text](image.png)";
			const result = markdownToPlainText(markdown);
			expect(result).toBe("Image: Alt text.");
		});

		it("should handle code blocks", () => {
			const markdown = "Some text\n```javascript\nconst x = 1;\n```\nMore text";
			const result = markdownToPlainText(markdown, false);
			expect(result).toBe("Some text\n\nMore text");
		});

		it("should include code blocks when requested", () => {
			const markdown = "```javascript\nconst x = 1;\n```";
			const result = markdownToPlainText(markdown, true);
			expect(result.trim()).toBe("[Code block in javascript]");
		});

		it("should handle inline code", () => {
			const markdown = "Use `npm install` to install";
			const result = markdownToPlainText(markdown);
			expect(result).toBe("Use npm install to install");
		});

		it("should handle lists", () => {
			const markdown = "- Item 1\n- Item 2\n- Item 3";
			const result = markdownToPlainText(markdown);
			expect(result).toContain("• Item 1");
			expect(result).toContain("• Item 2");
			expect(result).toContain("• Item 3");
		});

		it("should handle complex markdown", () => {
			const markdown = `# Welcome

This is a **test** document with [links](https://example.com).

## Features
- Feature 1
- Feature 2

\`\`\`javascript
console.log('hello');
\`\`\`

Use \`code\` inline.`;

			const result = markdownToPlainText(markdown);
			expect(result).toContain("Welcome.");
			expect(result).toContain("This is a test document with links.");
			expect(result).toContain("Features.");
			expect(result).toContain("• Feature 1");
			expect(result).toContain("• Feature 2");
			expect(result).toContain("Use code inline.");
			expect(result).not.toContain("console.log");
		});

		it("should remove simple HTML tags", () => {
			const markdown = "This has <strong>HTML</strong> tags";
			const result = markdownToPlainText(markdown);
			expect(result).toBe("This has HTML tags");
		});

		it("should handle nested HTML tags (security fix)", () => {
			// Test case from the security vulnerability report
			const markdown = "Test <script<script>alert('XSS')</script> content";
			const result = markdownToPlainText(markdown);
			// After removing nested tags, we should have no script tags
			expect(result).not.toContain("<script>");
			expect(result).not.toContain("</script>");
			expect(result).not.toContain("<script<script>");
		});

		it("should handle multiple levels of nested tags", () => {
			const markdown = "Test <<<nested>tag>> content";
			const result = markdownToPlainText(markdown);
			// Verify all angle brackets are removed
			expect(result).not.toContain("<");
			expect(result).not.toContain(">");
		});

		it("should handle overlapping HTML comments", () => {
			// Example from security report
			const markdown = "Test <!<!--- comment --->> content";
			const result = markdownToPlainText(markdown);
			// Verify no HTML comment markers remain
			expect(result).not.toContain("<!--");
			expect(result).not.toContain("-->");
			expect(result).not.toContain("<!");
		});

		it("should handle malformed tags", () => {
			const markdown = "Test <div<div>content</div</div> here";
			const result = markdownToPlainText(markdown);
			expect(result).toBe("Test content here");
		});

		it("should handle self-replicating patterns", () => {
			// Ensure the fix handles patterns that could recreate themselves
			const markdown = "Test <><><> nested <><><> tags";
			const result = markdownToPlainText(markdown);
			// After removing all empty tags, check spacing is normalized
			expect(result).toBe("Test nested tags");
		});
	});

	describe("isMarkdownFile", () => {
		it("should return true for markdown files", () => {
			expect(isMarkdownFile("test.md")).toBe(true);
			expect(isMarkdownFile("test.markdown")).toBe(true);
			expect(isMarkdownFile("test.mdown")).toBe(true);
			expect(isMarkdownFile("test.mkd")).toBe(true);
			expect(isMarkdownFile("test.mdx")).toBe(true);
		});

		it("should return false for non-markdown files", () => {
			expect(isMarkdownFile("test.txt")).toBe(false);
			expect(isMarkdownFile("test.js")).toBe(false);
			expect(isMarkdownFile("test.html")).toBe(false);
		});

		it("should be case insensitive", () => {
			expect(isMarkdownFile("test.MD")).toBe(true);
			expect(isMarkdownFile("test.MARKDOWN")).toBe(true);
		});
	});
});
