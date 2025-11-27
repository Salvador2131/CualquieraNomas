import nextPlugin from "@next/eslint-plugin-next";

export default [
  nextPlugin.configs["flat/core-web-vitals"],
];
import next from "eslint-config-next";

export default [
  ...next(),
];

