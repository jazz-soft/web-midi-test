import globals from "globals";
import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        files: ["*.js", "test/*.js"],
        languageOptions: {
            ecmaVersion: 2015,
            globals: {
                ...globals.browser,
                ...globals.node,
                define: "readonly",
                JZZ: "readonly"
            }
        },
        rules: {
            "no-constant-condition" : ["error", { "checkLoops": false }],
            "no-prototype-builtins" : "off",
            "no-unused-vars": ["error", { "args": "none" }]
        }
    },
    {
        files: ["test/*.js"],
        languageOptions: {
            globals: {
                describe: "readonly",
                it: "readonly",
                before: "readonly",
                after: "readonly"
            }
        }
    }
];