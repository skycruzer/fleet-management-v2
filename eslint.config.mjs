import pluginNext from '@next/eslint-plugin-next'
import pluginReact from 'eslint-plugin-react'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

const eslintConfig = tseslint.config(
  // Global ignores (MUST be first)
  {
    ignores: [
      '**/.next/**',
      '**/out/**',
      '**/build/**',
      '**/next-env.d.ts',
      '**/node_modules/**',
      '**/.storybook/**',
      '**/storybook-static/**',
      '**/.worktrees/**',
      '**/dist/**',
      '**/coverage/**',
      // External tools and templates (use CommonJS/different standards)
      'BMAD-METHOD/**',
      '.claude/skills/**',
      'backups/**',
      // Root-level test and utility scripts (mjs and js)
      '*.mjs',
      'test-*.mjs',
      'check-*.mjs',
      'manual-*.mjs',
      'test-*.js',
      'check-*.js',
      // Scripts directory (build/deployment utilities)
      'scripts/**',
      // Playwright config (uses specific patterns)
      'playwright.config.ts',
    ],
  },
  // TypeScript recommended (base rules)
  ...tseslint.configs.recommended,
  // Custom overrides (applied AFTER recommended to take precedence)
  {
    files: ['**/*.{js,jsx,mjs,ts,tsx}'],
    plugins: {
      '@next/next': pluginNext,
      react: pluginReact,
      'react-hooks': pluginReactHooks,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs['core-web-vitals'].rules,
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      // Override TS rules to be warnings instead of errors
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-unsafe-declaration-merging': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      // Next.js rules
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-img-element': 'error',
      '@next/next/no-assign-module-variable': 'warn',
      // React rules
      'react/no-unescaped-entities': 'warn',
      'react/react-in-jsx-scope': 'off', // Not needed in Next.js
      'react/prop-types': 'off', // Using TypeScript
    },
  }
)

export default eslintConfig
