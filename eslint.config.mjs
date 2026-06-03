import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactCompiler from "eslint-plugin-react-compiler";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      "react-compiler": reactCompiler,
    },
    rules: {
      "react-compiler/react-compiler": "error",
      // Enforce strict RSC boundaries (Quality Gate: error_on_invalid_client_boundary)
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next/navigation",
              importNames: ["useRouter", "usePathname", "useSearchParams"],
              message: "Please use these only in 'use client' components.",
            },
            {
              name: "react",
              importNames: ["useState", "useEffect", "useContext", "useReducer", "useCallback", "useMemo", "useRef", "useLayoutEffect"],
              message: "React hooks are only allowed in 'use client' components.",
            },
          ],
        },
      ],
      // Prevent unserializable props in RSC (Quality Gate: prevent_unserializable_props_in_RSC)
      // Note: This is partially handled by Next.js compiler, but we can add more checks here if needed.
    },

  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  prettier,
]);

export default eslintConfig;

