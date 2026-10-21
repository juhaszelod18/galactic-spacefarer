import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    env: { CDS_TYPESCRIPT: 'true' },
    execArgv: ['--import', 'tsx']
  }
})
