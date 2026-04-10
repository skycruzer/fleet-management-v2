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
      '**/node_modules_old/**',
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
      // TypeScript rules - off for production stability
      // These are acceptable in a mature codebase with complex types
      '@typescript-eslint/no-unused-vars': [
        'off',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unsafe-declaration-merging': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      // Next.js rules
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-img-element': 'error',
      '@next/next/no-assign-module-variable': 'off',
      // React rules
      'react/no-unescaped-entities': 'off',
      'react/react-in-jsx-scope': 'off', // Not needed in Next.js
      'react/prop-types': 'off', // Using TypeScript
      // React hooks - disable problematic rules
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  }
)

export default eslintConfig
