import esbuild from 'esbuild';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';
import fs from 'fs';
import path from 'path';

const isDev = process.argv.includes('--watch');

// PostCSS plugin to expand Tailwind and apply autoprefixer
const postcssPlugin = {
  name: 'postcss-tailwind',
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      const source = await fs.promises.readFile(args.path, 'utf8');
      const result = await postcss([tailwindcss, autoprefixer]).process(source, { from: args.path });
      return { contents: result.css, loader: 'css' };
    });
  }
};

// Recursively copy static assets into dist so images/fonts are available in dev and prod
async function copyDir(src, dest) {
  await fs.promises.mkdir(dest, { recursive: true });
  const entries = await fs.promises.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}

// Copy index.html into dist after each build
const copyIndexPlugin = {
  name: 'copy-index',
  setup(build) {
    build.onEnd(async () => {
      const target = path.join('dist', 'index.html');
      await fs.promises.mkdir('dist', { recursive: true });
      await fs.promises.copyFile('index.html', target);
    });
  }
};

// Copy static assets (images, icons, etc.) into dist/assets
const copyAssetsPlugin = {
  name: 'copy-assets',
  setup(build) {
    build.onEnd(async () => {
      const src = path.join('assets');
      const dest = path.join('dist', 'assets');
      if (fs.existsSync(src)) {
        await copyDir(src, dest);
      }
    });
  }
};

// Only two entry points so outputs land at dist/app.js and dist/main.css
const entryPoints = [
  'js/app.js',
  'css/main.css'
];

const buildOptions = {
  entryPoints,
  bundle: true,
  outdir: 'dist',
  entryNames: '[name]',
  assetNames: '[name]',
  loader: {
    '.css': 'css'
  },
  plugins: [postcssPlugin, copyIndexPlugin, copyAssetsPlugin],
  minify: !isDev,
  sourcemap: isDev ? 'linked' : false,
  format: 'esm',
  splitting: false,
  logLevel: 'info'
};

async function run() {
  // Clean dist to avoid stale outputs from older configs
  await fs.promises.rm('dist', { recursive: true, force: true });

  const ctx = await esbuild.context(buildOptions);

  // Initial build
  await ctx.rebuild();

  if (isDev) {
    await ctx.watch();
    
    // Create a simple HTTP server with SPA fallback
    const http = await import('http');
    const url = await import('url');
    
    const serveWithFallback = (req, res) => {
      const pathname = url.parse(req.url).pathname;
      let filepath = path.join('dist', pathname);
      
      // If path ends with / or has no extension, try index.html
      if (pathname === '/' || !path.extname(pathname)) {
        filepath = path.join('dist', pathname === '/' ? 'index.html' : pathname + '.html');
      }
      
      // Try to serve the file
      fs.promises.readFile(filepath)
        .then(data => {
          const ext = path.extname(filepath);
          const contentTypes = {
            '.html': 'text/html',
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.webp': 'image/webp',
            '.ico': 'image/x-icon'
          };
          res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
          res.end(data);
        })
        .catch(() => {
          // If file not found, serve index.html for SPA routing
          fs.promises.readFile(path.join('dist', 'index.html'))
            .then(data => {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(data);
            })
            .catch(() => {
              res.writeHead(404);
              res.end('Not found');
            });
        });
    };
    
    let servePort = 3000;
    try {
      const server = http.createServer(serveWithFallback);
      await new Promise((resolve, reject) => {
        server.listen(servePort, () => {
          console.log(`🚀 Dev server running at http://localhost:${servePort}`);
          console.log(`📝 All routes will fallback to index.html for SPA routing`);
          resolve();
        }).on('error', reject);
      });
    } catch (err) {
      if (err && err.code === 'EADDRINUSE') {
        servePort = 3001;
        const server = http.createServer(serveWithFallback);
        await new Promise((resolve, reject) => {
          server.listen(servePort, () => {
            console.log(`🚀 Dev server running at http://localhost:${servePort}`);
            console.log(`📝 All routes will fallback to index.html for SPA routing`);
            resolve();
          }).on('error', reject);
        });
      } else {
        throw err;
      }
    }
  } else {
    await ctx.dispose();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
