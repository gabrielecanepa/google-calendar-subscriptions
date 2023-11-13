import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'build',
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  minify: true,
  clean: true,
})
