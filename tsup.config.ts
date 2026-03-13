import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm', 'iife'],
  globalName: 'CRXLens',
  dts: true,
  clean: true,
  minify: true,
  target: 'es2020',
});
