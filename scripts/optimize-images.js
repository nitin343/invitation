import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '../public/assets');

const imageExtensions = ['.jpg', '.jpeg', '.png', '.jfif'];

console.log('🖼️  Starting advanced image optimization with Sharp...\n');

async function optimizeImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const filename = path.basename(filePath);
  const filenameWithoutExt = filename.replace(ext, '');
  
  try {
    const originalSize = fs.statSync(filePath).size;
    
    // 1. Create AVIF (ultra-compressed, modern format - 40% smaller than WebP)
    const avifPath = path.join(assetsDir, `${filenameWithoutExt}-opt.avif`);
    await sharp(filePath)
      .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
      .avif({ quality: 70 })
      .toFile(avifPath);
    
    // 2. Create WebP (30-40% smaller than JPEG)
    const webpPath = path.join(assetsDir, `${filenameWithoutExt}-opt.webp`);
    await sharp(filePath)
      .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(webpPath);
    
    // 3. Create optimized JPEG/PNG fallback
    if (['.jpg', '.jpeg', '.jfif'].includes(ext)) {
      const jpgPath = path.join(assetsDir, `${filenameWithoutExt}-opt.jpg`);
      await sharp(filePath)
        .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80, progressive: true, mozjpeg: true })
        .toFile(jpgPath);
    } else if (ext === '.png') {
      const pngPath = path.join(assetsDir, `${filenameWithoutExt}-opt.png`);
      await sharp(filePath)
        .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
        .png({ quality: 80, compressionLevel: 9 })
        .toFile(pngPath);
    }
    
    // 4. Create tiny blur-up placeholder (10x10, heavily compressed for data-URI)
    const blurPath = path.join(assetsDir, `${filenameWithoutExt}-blur.jpg`);
    const blurData = await sharp(filePath)
      .resize(10, 10, { fit: 'cover' })
      .blur(10)
      .jpeg({ quality: 60 })
      .toBuffer();
    fs.writeFileSync(blurPath, blurData);
    
    const avifSize = fs.statSync(avifPath).size;
    const webpSize = fs.statSync(webpPath).size;
    
    console.log(`✅ ${filename}`);
    console.log(`   Original:    ${(originalSize / 1024).toFixed(1)}KB`);
    console.log(`   AVIF (best): ${(avifSize / 1024).toFixed(1)}KB (${(((originalSize - avifSize) / originalSize) * 100).toFixed(1)}% smaller)`);
    console.log(`   WebP:        ${(webpSize / 1024).toFixed(1)}KB`);
    console.log(`   Blur:        ${(blurData.length / 1024).toFixed(1)}KB\n`);
  } catch (error) {
    console.error(`❌ Error optimizing ${filename}:`, error.message);
  }
}

async function main() {
  try {
    const files = fs.readdirSync(assetsDir);
    
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (imageExtensions.includes(ext) && !file.includes('-opt') && !file.includes('-blur')) {
        const filePath = path.join(assetsDir, file);
        await optimizeImage(filePath);
      }
    }
    
    console.log('✨ Image optimization complete!');
    console.log('📦 Generated formats: AVIF (best), WebP (modern), JPEG/PNG (fallback), Blur (placeholder)');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
