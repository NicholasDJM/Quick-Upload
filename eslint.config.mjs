import { defineConfig } from "eslint/config";
import eslint from "@eslint/js";
import unicorn from "eslint-plugin-unicorn";
import sonarjs from "eslint-plugin-sonarjs";
import globals from "globals";

export default defineConfig(
    eslint.configs.recommended,
    unicorn.configs.recommended,
    sonarjs.configs.recommended,
    {
        files: ["**/*.js"],
        "languageOptions": {
            "globals": {
                ...globals.node
            }
        },
        rules: {
            "unicorn/import-style": [
                "error",
                {
                    "styles": {
                        "node:path": {
                            "named": true
                        },
                        "path": {
                            "named": true
                        }
                    }
                }
            ]
        }
    }
)