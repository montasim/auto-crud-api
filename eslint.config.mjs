import pluginJs from '@eslint/js';

/**
 * ESLint configuration for a JavaScript/TypeScript project.
 *
 * This configuration includes rules and settings for general JavaScript and React projects.
 * It aims to enforce best practices, coding conventions, and ensure code consistency.
 *
 * The configuration includes:
 * - File matching patterns
 * - Language options including global variables
 * - Plugins such as eslint-plugin-react
 * - Defined rulesets and recommended configurations
 * - Custom rule adjustments for project requirements
 * - Ignored files and directories
 *
 * @type {import('eslint').Linter.Config[]}
 */
export default [
    {
        /**
         * Specifies the files to which this configuration applies.
         * Matches JavaScript, TypeScript, and JSX/TSX files.
         */
        files: ['**/*.{ts,js,mjs,cjs,tsx,jsx}'],
    },

    {
        /**
         * Defines global variables that are available in the project's runtime environment.
         * Includes browser globals and additional global variables like `Buffer`, `process`, etc.
         */
        languageOptions: {
            globals: {
                // Adds Node.js global variables
                Buffer: 'readonly',
                process: 'readonly',
                module: 'readonly',
                require: 'readonly',
                console: 'readonly',

                // Adds
                URL: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
            },
        },
    },

    /**
     * Adds plugin configurations:
     * - @eslint/js: Provides general JavaScript linting rules.
     * - eslint-plugin-react: Adds rules for React projects, ensuring React-specific best practices.
     */
    pluginJs.configs.recommended,

    {
        /**
         * Custom ESLint rules to enforce or relax specific coding conventions.
         */
        rules: {
            // Allows usage of console.warn, console.error, and console.table
            'no-console': [
                'warn',
                { allow: ['info', 'error', 'warn', 'table'] },
            ],
            'func-names': 'off', // Disables the requirement to name function expressions
            'no-underscore-dangle': 'off', // Allows variable names starting with underscores
            'consistent-return': 'off', // Allows functions with inconsistent return behaviors
            'jest/expect-expect': 'off', // Disables rule requiring assertions in Jest tests
            'security/detect-object-injection': 'off', // Disables warning for object injection risks
            quotes: [
                'error',
                'single', // Enforces single quotes for strings
                { avoidEscape: true, allowTemplateLiterals: true },
            ],
            semi: ['error', 'always'], // Requires semicolon termination for statements
            'prefer-arrow-callback': [
                'error',
                {
                    allowNamedFunctions: false, // Disallow named function expressions
                    allowUnboundThis: true, // Allow using `this` context inside arrow functions
                },
            ],
            'prefer-const': 'error', // Prefer const for variables that are not reassigned
            'arrow-spacing': ['error', { before: true, after: true }], // Requires spaces around arrow operators
            'no-var': 'error', // Disallows the use of `var`
            'object-shorthand': ['error', 'always'], // Enforces shorthand for object literals
            'prefer-template': 'error', // Enforces use of template literals instead of concatenation
            eqeqeq: ['error', 'always'], // Strict equality comparison required (=== instead of ==)
            'template-curly-spacing': 'error', // Prohibits spaces inside template string interpolation
            'prefer-rest-params': 'error', // Encourages the use of rest parameters
            'no-new-symbol': 'error', // Prevents creating new instances of `Symbol`
            'symbol-description': 'error', // Requires descriptions for `Symbol` instances
            'prefer-spread': 'error', // Favor use of spread syntax for function arguments
            'no-duplicate-imports': 'error', // Disallows importing the same module multiple times
            'no-unused-vars': 'warn', // Warn about variables that are declared but not used
        },
    },

    {
        /**
         * Defines file and directory patterns to ignore during linting.
         * Helps exclude unneeded directories like build artifacts or configuration files.
         */
        ignores: [
            '.github/**', // Ignore GitHub-specific configuration files and directories
            '.husky/**', // Ignore Husky configuration and hook scripts
            '.idea/**', // Ignore JetBrains IDE (e.g., WebStorm) project configuration files
            '.next/**', // Ignore Next.js build output directory to avoid unnecessary processing
            '.yarn/**', // Ignore Yarn cache, configuration, and installation-related files
            'node_modules/**', // Ignore third-party dependency files (handled by package manager)
            'build/**', // Ignore build output directory (e.g., production-ready files)
            'logs/**', // Ignore application log files (e.g., error or debug logs)
            'src/modules/api/documentation/**', // Ignore auto-generated API documentation files

            'yarn.lock', // Ignore the Yarn lock file (used for dependency resolution)
            'terser.js', // Ignore the Terser script used for minification
            'Postman_Collection.json', // Ignore the Postman collection file
        ],
    },
];
