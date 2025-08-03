import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const buildConfig = {
  entryPoints: [join(__dirname, 'src/app.js')],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: join(__dirname, 'dist/app.js'),
  format: 'esm',
  external: [
    'express',
    'dotenv', 
    'cookie-session',
    'axios',
    'googleapis',
    'uuid'
  ],
  minify: process.env.NODE_ENV === 'production',
  sourcemap: process.env.NODE_ENV !== 'production',
};

try {
  await build(buildConfig);
  console.log('✅ Build completed successfully!');
  console.log(`📦 Output: ${buildConfig.outfile}`);
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}
