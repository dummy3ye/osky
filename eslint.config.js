module.exports = [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        fetch: "readonly",
        navigator: "readonly",
        location: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
      },
    },
    rules: {
      "no-unused-vars": [
        "warn",
        { varsIgnorePattern: "^(renderMarkdown|loadProject)$" },
      ],
      "no-console": "off",
      eqeqeq: "error",
      curly: "error",
    },
  },
];
