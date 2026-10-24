import { cp, rm } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });

const result = await Bun.build({
  entrypoints: ['src/index.html'],
  outdir: 'dist',
  minify: true,
});
if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

// GitHub Pages custom domain
await cp('CNAME', 'dist/CNAME');

for (const o of result.outputs) console.log(o.path.replace(process.cwd() + '/', ''), `${(o.size / 1024).toFixed(1)} KB`);
