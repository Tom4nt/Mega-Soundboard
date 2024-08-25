import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all
});

export default [...compat.extends(
	"eslint:recommended",
	"plugin:@typescript-eslint/eslint-recommended",
	"plugin:@typescript-eslint/recommended",
	"plugin:@typescript-eslint/recommended-requiring-type-checking",
), {
	plugins: {
		"@typescript-eslint": typescriptEslint,
	},

	languageOptions: {
		parser: tsParser,
		ecmaVersion: 5,
		sourceType: "script",

		parserOptions: {
			tsconfigRootDir: ".",
			project: ["tsconfig.json"],
		},
	},

	rules: {
		semi: "error",

		quotes: ["error", "double", {
			allowTemplateLiterals: true,
		}],

		"consistent-return": "error",
		"@typescript-eslint/explicit-function-return-type": "error",
		"@typescript-eslint/no-unnecessary-condition": "warn",
		"@typescript-eslint/require-await": "off",

		"@typescript-eslint/no-unused-vars": ["error", {
			argsIgnorePattern: "_",
		}],

		"@typescript-eslint/no-misused-promises": ["error", {
			checksVoidReturn: {
				arguments: false,
			},
		}],
	},
}];
