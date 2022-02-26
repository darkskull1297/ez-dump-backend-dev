module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'prettier',
    'prettier/@typescript-eslint',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  rules: {
    "indent": "off",
    "arrow-parens": "off",
    'import/no-cycle': 'off',
    "no-await-in-loop": "off",
    "no-param-reassign": "off",
    "max-classes-per-file": "off",
    "no-restricted-syntax": "off",
    "no-underscore-dangle": "off",
    "no-useless-constructor": "off",
    "linebreak-style": [0, "error"],
    "class-methods-use-this": "off",
    "import/prefer-default-export": "off",
    "@typescript-eslint/indent": ["error", 2],
    '@typescript-eslint/no-misused-new': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    "comma-dangle": ["error", "always-multiline"],
    'import/extensions': ['error', { 'ts': 'never' }],
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    "@typescript-eslint/explicit-member-accessibility": "off",
    "lines-between-class-members": ["error", "always", { exceptAfterSingleLine: true }],
    "@typescript-eslint/explicit-function-return-type": ["warn", { allowExpressions: true }],
  },
  "settings": {
    "import/resolver": {
      "node": {
        "extensions": [".js", ".jsx", ".ts", ".tsx", ".d.ts"]
      }
    },
  },
};
