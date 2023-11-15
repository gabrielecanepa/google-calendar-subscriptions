import { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts', '**/test/*.ts'],
  setupFiles: ['dotenv/config'],
}

export default config
