#!/usr/bin/env node

const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary with credentials from .env.local
const apiKey = '778593721563446';
const apiSecret = 'PBAyhU5kcvBqTrMKT6ozMlJABsg';
const cloudName = 'dr5frqshz';

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

const assetsDir = path.join(__dirname, '../public/assets');

async function uploadImages() {
  console.log('🚀 Starting Cloudinary image upload...\n');

  const files = fs.readdirSync(assetsDir);
  const imageFiles = files.filter(f => /\.(jpg|jpeg|png|jfif|gif)$/i.test(f));

  console.log(`Found ${imageFiles.length} image files to upload\n`);

  for (const file of imageFiles) {
    const filePath = path.join(assetsDir, file);
    const fileName = path.parse(file).name;

    try {
      console.log(`⏳ Uploading: ${file}`);

      const result = await cloudinary.uploader.upload(filePath, {
        public_id: fileName,
        overwrite: true,
        resource_type: 'auto',
        quality: 'auto',
        fetch_format: 'auto',
      });

      console.log(`✅ Success: ${file}`);
      console.log(`   URL: ${result.secure_url}\n`);
    } catch (error) {
      console.error(`❌ Failed: ${file}`);
      console.error(`   Error: ${error.message}\n`);
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Upload complete!');
  console.log('📍 Check Media Library: https://cloudinary.com/console/media_library');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

uploadImages().catch(console.error);
