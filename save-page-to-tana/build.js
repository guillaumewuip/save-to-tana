import esbuild from 'esbuild';
import { mkdir } from 'fs/promises';

const buildOptions = {
  entryPoints: ['src/background/index.js'],
  outfile: 'dist/background.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  minify: false,
};

async function build() {
  await mkdir('dist', { recursive: true });
  
  await esbuild.build(buildOptions);
  console.log('Build complete!');
}

build().catch(console.error);
