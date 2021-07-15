import typescript from '@rollup/plugin-typescript'
import { terser } from 'rollup-plugin-terser'
import cleanup from 'rollup-plugin-cleanup'

export default {
  input: 'src/index.tsx',
  output: {
    dir: 'dist',
    format: 'cjs',
    sourcemap: true,
  },
  plugins: [
    typescript({ target: 'es5', tsconfig: 'tsconfig.main.json' }),
    cleanup({ comments: 'none' }),
    terser(),
  ],
}
