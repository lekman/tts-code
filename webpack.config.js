import path from "path";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Webpack configuration for ElevenLabs Text-to-Speech for VSCode extension (ESM format).
 * Bundles the extension for VSCode's Node.js runtime.
 */
export default {
	target: "node",
	mode: "production",
	entry: "./src/extension.ts",
	output: {
		path: path.resolve(__dirname, "out"),
		filename: "extension.js",
		libraryTarget: "commonjs2",
		clean: true,
	},
	devtool: "source-map",
	externals: {
		vscode: "commonjs vscode", // Exclude VSCode API from bundle
	},
	resolve: {
		extensions: [".ts", ".js"],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: [
					{
						loader: "ts-loader",
						options: {
							configFile: "tsconfig.json",
						},
					},
				],
			},
		],
	},
	plugins: [new CleanWebpackPlugin()],
	infrastructureLogging: {
		level: "log",
	},
};
