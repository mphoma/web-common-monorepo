import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "rollup-plugin-babel";
import includePaths from "rollup-plugin-includepaths";
import { eslint } from "rollup-plugin-eslint";

let includePathOptions = {
	paths: ["src"],
	extensions: [".ts"],
};

export default {
	input: "src/index.ts",
	output: {
		file: "lib/index.js",
		format: "cjs",
	},
	plugins: [
		includePaths(includePathOptions),
		babel(),
		resolve(),
		commonjs(),
		eslint(),
	],
};
