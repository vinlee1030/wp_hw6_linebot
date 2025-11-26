import nextPlugin from "@next/eslint-plugin-next";

export default [
  nextPlugin.configs["core-web-vitals"],
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];

