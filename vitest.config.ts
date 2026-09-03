import { defineConfig, configDefaults } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '.next/',
        '**/*.config.ts',
        '**/*.d.ts',
      ],
    },
    include: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.spec.ts'],
    // Worktrees do Claude em .claude/worktrees/ são cópias completas do repo.
    // Sem isso o vitest varre cada cópia e reporta os mesmos testes N vezes
    // (chegou a rodar 22 cópias: "616 testes" quando são 28).
    exclude: [...configDefaults.exclude, '**/.claude/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
