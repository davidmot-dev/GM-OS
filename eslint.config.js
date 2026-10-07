import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Les candidats archivés sont des témoins de conception, pas le code exécuté.
  globalIgnores(['dist', 'dist-electron', 'v7-migration', 'backups', '**/chrome_profile_notebooklm', 'documentation/**/candidats/**']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  /*
    **Pourquoi `no-explicit-any` est un avertissement et non une erreur.**

    Le script sortait 585 erreurs, dont 468 pour cette seule regle : rouge en
    permanence, donc plus jamais lance. Et c'est pourtant lui qui a trouve les
    deux vrais bugs de la revue du 2026-09-10 — le `NaN` de la barre de vie
    (`no-constant-binary-expression`, 2 occurrences) et les 27 crochets
    conditionnels du hub (`rules-of-hooks`).

    *Un signal noye est un signal perdu.* Les `any` restent comptes et visibles ;
    ils se traitent fichier par fichier, quand on y passe pour autre chose. Ce
    qui bloque, ce sont les regles qui designent un defaut.
  */
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      // Un nom préfixé par _ et les champs retirés d'un objet sont intentionnels.
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true,
      }],
      // 07/10/2026 : React Compiler n'est pas activé dans Vite. Ces deux
      // diagnostics de performance restent visibles, à traiter par écran ;
      // ils ne bloquent pas le contrôle des hooks, refs et rendus impurs.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
    },
  },
  /* Les tests montent des modules par `require` a dessein, pour contourner le
     cache d'ESM entre deux cas. Ce n'est pas une dette, c'est leur outillage. */
  {
    files: ['**/*.test.{ts,tsx}'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
])
