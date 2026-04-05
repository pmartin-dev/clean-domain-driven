import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@catalog': resolve(__dirname, 'src/modules/catalog'),
      '@lending': resolve(__dirname, 'src/modules/lending'),
    },
  },
  test: {
    include: ['src/**/tests/**/*.test.ts'],
  },
});
