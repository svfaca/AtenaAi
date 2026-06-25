#!/usr/bin/env node

/**
 * Frontend Minification Build Script
 * Minifies all JavaScript files in the frontend
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const jsDir = path.join(__dirname, 'js');
const distDir = path.join(__dirname, 'dist');

function collectJsFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'dist') continue;
            files.push(...collectJsFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            files.push(fullPath);
        }
    }

    return files;
}

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Get all JavaScript files recursively inside js/
const jsFiles = collectJsFiles(jsDir);

console.log(`🔨 Building ${jsFiles.length} JavaScript files...`);
console.log(`📁 Output directory: ${distDir}`);

esbuild.buildSync({
    entryPoints: jsFiles,
    outdir: distDir,
    minify: true,
    sourcemap: 'linked',
    logLevel: 'info',
    outExtension: {
        '.js': '.min.js'
    }
});

console.log('✅ Frontend minification complete!');

// Calculate size reduction
let originalSize = 0;
let minifiedSize = 0;

jsFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    originalSize += Buffer.byteLength(content);
});

fs.readdirSync(distDir).forEach(file => {
    if (file.endsWith('.min.js')) {
        const filePath = path.join(distDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        minifiedSize += Buffer.byteLength(content);
    }
});

const reduction = ((1 - minifiedSize / originalSize) * 100).toFixed(2);
console.log(`\n📊 Size Reduction:`);
console.log(`   Original: ${(originalSize / 1024).toFixed(2)} KB`);
console.log(`   Minified: ${(minifiedSize / 1024).toFixed(2)} KB`);
console.log(`   Reduction: ${reduction}%`);
