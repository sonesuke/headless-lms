
import  path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'lib/main.ts'),
      name: 'HeadLessLMS',
      formats: ['umd'],
      fileName: 'headless-lms'
    },
  },
})