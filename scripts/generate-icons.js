const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconSizes = [
  { name: 'icon-20@2x.png', size: 40 },
  { name: 'icon-20@3x.png', size: 60 },
  { name: 'icon-29@2x.png', size: 58 },
  { name: 'icon-29@3x.png', size: 87 },
  { name: 'icon-40@2x.png', size: 80 },
  { name: 'icon-40@3x.png', size: 120 },
  { name: 'icon-60@2x.png', size: 120 },
  { name: 'icon-60@3x.png', size: 180 },
  { name: 'icon-1024.png', size: 1024 },
];

const inputIcon = path.join(__dirname, '../src/assets/images/icon.png');
const outputDir = path.join(__dirname, '../ios/ClearCue2/Images.xcassets/AppIcon.appiconset');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  console.log('Generating iOS app icons...');

  for (const icon of iconSizes) {
    const outputPath = path.join(outputDir, icon.name);

    try {
      await sharp(inputIcon)
        .resize(icon.size, icon.size)
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`❌ Failed to generate ${icon.name}:`, error.message);
    }
  }

  // Generate Contents.json for AppIcon.appiconset
  const contentsJson = {
    images: [
      {
        filename: 'icon-20@2x.png',
        idiom: 'iphone',
        scale: '2x',
        size: '20x20',
      },
      {
        filename: 'icon-20@3x.png',
        idiom: 'iphone',
        scale: '3x',
        size: '20x20',
      },
      {
        filename: 'icon-29@2x.png',
        idiom: 'iphone',
        scale: '2x',
        size: '29x29',
      },
      {
        filename: 'icon-29@3x.png',
        idiom: 'iphone',
        scale: '3x',
        size: '29x29',
      },
      {
        filename: 'icon-40@2x.png',
        idiom: 'iphone',
        scale: '2x',
        size: '40x40',
      },
      {
        filename: 'icon-40@3x.png',
        idiom: 'iphone',
        scale: '3x',
        size: '40x40',
      },
      {
        filename: 'icon-60@2x.png',
        idiom: 'iphone',
        scale: '2x',
        size: '60x60',
      },
      {
        filename: 'icon-60@3x.png',
        idiom: 'iphone',
        scale: '3x',
        size: '60x60',
      },
      {
        filename: 'icon-1024.png',
        idiom: 'ios-marketing',
        scale: '1x',
        size: '1024x1024',
      },
    ],
    info: {
      author: 'xcode',
      version: 1,
    },
  };

  fs.writeFileSync(
    path.join(outputDir, 'Contents.json'),
    JSON.stringify(contentsJson, null, 2)
  );

  console.log('✅ Generated Contents.json for AppIcon.appiconset');
  console.log('🎉 All iOS app icons generated successfully!');
}

generateIcons().catch(console.error);
