/**
 * @type {import('@commitlint/types').UserConfig}
 */
const config = {
  extends: ['@commitlint/config-conventional'],
  ignores: [commit => /build\(deps(-dev)?\)/.test(commit)],
  defaultIgnores: true,
}

export default config
