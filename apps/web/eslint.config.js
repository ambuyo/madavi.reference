import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginAstro from "eslint-plugin-astro";
import eslintPluginReact from "eslint-plugin-react";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      react: eslintPluginReact,
      "react-hooks": eslintPluginReactHooks,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...eslintPluginReact.configs.recommended.rules,
      ...eslintPluginReactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off", // React 17+ doesn't need React in scope
      "react/prop-types": "off", // TS handles props validation
      "@typescript-eslint/no-explicit-any": "off", // Allow explicit any for Sanity and API structures
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }], // Treat unused vars as warnings
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    },
  },
  {
    ignores: [
      ".astro/**/*",
      "dist/**/*",
      "node_modules/**/*",
      ".netlify/**/*",
    ],
  }
);
