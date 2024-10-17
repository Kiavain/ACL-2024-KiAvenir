import prettier from "eslint-plugin-prettier";

export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module"
    },
    plugins: {
      prettier
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
      ]
    }
  }
];
