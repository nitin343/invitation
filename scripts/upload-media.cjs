#!/usr/bin/env node

const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

const cloudName = 'dr5frqshz';
const apiKey = '778593721563446';
const apiSecret = 'PBAyhU5kcvBqTrMKT6ozMlJABsg';

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

const assetsDir = path.join(__dirname, '../public/assets');

async function uploadMedia() {
  console.log('🎬 Starting audio/video upload...\n');

  const files = fs.readdirSync(assetsDir);
  const mediaFiles = files.filter(f => /\.(mp3|mp4|wav|m4a|webm)$/i.test(f));

  console.log(`Found ${mediaFiles.length} media files\n`);

  for (const file of mediaFiles) {
    const filePath = path.join(assetsDir, file);
    const fileName = path.parse(file).name.replace(/\s+/g, '_').toLowerCase();

    try {
      console.log(`⏳ Uploading: ${file}`);

      const result = await cloudinary.uploader.upload(filePath, {
        public_id: fileName,
        overwrite: true,
        resource_type: 'auto',
      });

      console.log(`✅ Success: ${file}`);
      console.log(`   URL: ${result.secure_url}\n`);
    } catch (error) {
      console.error(`❌ Failed: ${file}`);
      console.error(`   Error: ${error.message}\n`);
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ Media upload complete!');
}

uploadMedia().catch(console.error);
