import { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts', '**/test/index.ts'],
  setupFiles: ['dotenv/config'],
}

export default config
