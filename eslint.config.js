import prettier from "eslint-plugin-prettier";
import jest from "eslint-plugin-jest";

export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: jest.environments.globals.globals
    },
    plugins: {
      prettier,
      jest
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
      eqeqeq: "error",
      curly: "error",
      "no-trailing-spaces": "error",
      semi: ["error", "always"],
      quotes: ["error", "double"],
      "no-multiple-empty-lines": ["error", { max: 1 }],
      "prettier/prettier": [
        "error",
        {
          endOfLine: "auto",
          singleQuote: false,
          semi: true,
          tabWidth: 2,
          trailingComma: "none",
          printWidth: 120
        }
      ],
      "jest/no-disabled-tests": "warn",
      "jest/no-focused-tests": "error",
      "jest/no-identical-title": "error",
      "jest/prefer-to-have-length": "warn",
      "jest/valid-expect": "error"
    }
  }
];
