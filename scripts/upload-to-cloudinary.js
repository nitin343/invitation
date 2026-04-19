#!/usr/bin/env node

const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME || 'nitin343',
  api_key: process.env.VITE_CLOUDINARY_API_KEY,
  api_secret: process.env.VITE_CLOUDINARY_API_SECRET,
});

const assetsDir = path.join(__dirname, '../public/assets');
const uploadFolder = 'wedding-assets';

// File extensions to upload
const imageExtensions = ['.jpg', '.jpeg', '.png', '.jfif', '.gif', '.webp'];
const videoExtensions = ['.mp4', '.webm'];
const audioExtensions = ['.mp3', '.wav', '.m4a'];

async function uploadAssets() {
  console.log('🚀 Starting Cloudinary upload...\n');

  try {
    const files = glob.sync(`${assetsDir}/*`);

    let uploaded = 0;
    let skipped = 0;

    for (const file of files) {
      const filename = path.basename(file);
      const ext = path.extname(file).toLowerCase();

      // Skip non-media files
      if (
        ![...imageExtensions, ...videoExtensions, ...audioExtensions].includes(
          ext
        )
      ) {
        skipped++;
        continue;
      }

      try {
        console.log(`⏳ Uploading: ${filename}`);

        const options = {
          public_id: `${uploadFolder}/${path.basename(
            filename,
            ext
          )}`,
          resource_type: videoExtensions.includes(ext)
            ? 'video'
            : audioExtensions.includes(ext)
            ? 'video'
            : 'image',
          overwrite: true,
          use_filename: true,
          // Image optimizations
          quality: 'auto',
          fetch_format: 'auto',
          // Tags for organization
          tags: ['wedding-invitation'],
        };

        const result = await cloudinary.uploader.upload(file, options);
        console.log(`✅ ${filename} → ${result.secure_url}\n`);
        uploaded++;
      } catch (error) {
        console.error(`❌ Failed to upload ${filename}:`, error.message);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Upload Summary:`);
    console.log(`   ✅ Uploaded: ${uploaded}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📍 Folder: ${uploadFolder}/`);
    console.log(`   🔗 Base URL: https://res.cloudinary.com/${process.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

uploadAssets();
