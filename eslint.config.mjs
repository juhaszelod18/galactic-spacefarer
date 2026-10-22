import cds from '@sap/cds/eslint.config.mjs'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['@cds-models/', 'node_modules/'] },
  ...cds.recommended,
  ...tseslint.configs.recommended,
)
