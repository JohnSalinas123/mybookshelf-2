module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    '@electron-toolkit/eslint-config-ts/recommended',
    '@electron-toolkit/eslint-config-prettier'
  ],
  rules: {
    'react/prop-types': 'off',
    'object-curly-spacing': ['off'],
    'quotes': ['off'],
    'prettier/prettier': 'off',
  }
}
