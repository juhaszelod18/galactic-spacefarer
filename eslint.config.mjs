import cds from '@sap/cds/eslint.config.mjs'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['@cds-models/', 'node_modules/', 'app/'] },
  ...cds.recommended,
  ...tseslint.configs.recommended,
)
