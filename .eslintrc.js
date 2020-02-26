module.exports = {
  env: {
    node: true,
    es6: true,
    mocha: true
  },
  extends: [
    'semistandard'
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    // Using es6 env automatically sets the ecmaVersion to 6, so why fight it here
    // ecmaVersion: 2018, 
    sourceType: 'module'
  },
  plugins: [
    '@typescript-eslint'
  ],
  rules: {
  }
}
