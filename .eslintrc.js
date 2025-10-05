module.exports = {
  extends: ['expo', '@react-native'],
  rules: {
    'react/no-unescaped-entities': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'import/no-unresolved': 'off',
    'import/extensions': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-implicit-any': 'off',
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
  },
};
