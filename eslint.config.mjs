// @ts-check

import eslint from "@eslint/js";
import tsEslint from "typescript-eslint";
import unusedImports from "eslint-plugin-unused-imports";

export default tsEslint.config(
  {
    ignores: [
      "build/",
      "dist/",
      ".vscode/",
      "node_modules/",
      "templates/",
      "public/",
      ".circleci/",
    ],
  },
  {
    files: ["src/**/*.ts", "test/**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tsEslint.configs.recommendedTypeChecked,
    ],
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      // Additional rules:
      ...{
        eqeqeq: "error",
        "no-console": "error",
        "prefer-template": "error",
        "@typescript-eslint/no-shadow": "error",
        "no-unreachable": "error",
        "unused-imports/no-unused-imports": "warn",
      },

      // Additional config for rules:
      ...{
        "@typescript-eslint/explicit-module-boundary-types": [
          "error",
          { allowArgumentsExplicitlyTypedAsAny: true },
        ],
        "@typescript-eslint/no-unused-vars": [
          "warn",
          { args: "none", caughtErrors: "none" },
        ],
      },

      // Disabled rules:
      ...{
        "prefer-const": "off",
        "no-shadow": "off", // Replaced with "@typescript-eslint/no-shadow".
        "no-unused-vars": "off", // Replaced with "@typescript-eslint/no-unused-vars".
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/unbound-method": "off",
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/no-empty-object-type": "off",
      },

      // Rules to be enabled:
      ...{
        "@typescript-eslint/ban-types": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/restrict-template-expressions": "off",
        "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
      },

      // Rules to be discussed:
      ...{
        "prefer-spread": "off",
        "no-async-promise-executor": "off",
        "no-case-declarations": "off",
        "no-fallthrough": "off",
        "no-inner-declarations": "off",
        "@typescript-eslint/require-await": "off",
        "@typescript-eslint/prefer-regexp-exec": "off",
      },
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        warnOnUnsupportedTypeScriptVersion: false,
      },
    },
  },
  {
    files: ["test/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
    },
  }
);
