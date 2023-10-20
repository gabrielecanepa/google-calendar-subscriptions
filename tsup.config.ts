import { defineConfig, Options } from 'tsup'

const opts: Options = {
  entry: ['src/index.ts'],
  outDir: 'build',
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  minify: true,
  clean: true,
}

export default defineConfig(opts)
