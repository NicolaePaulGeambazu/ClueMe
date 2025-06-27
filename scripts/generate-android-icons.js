const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const androidIconSizes = [
  { name: 'ic_launcher.png', size: 48, density: 'mdpi' },
  { name: 'ic_launcher.png', size: 72, density: 'hdpi' },
  { name: 'ic_launcher.png', size: 96, density: 'xhdpi' },
  { name: 'ic_launcher.png', size: 144, density: 'xxhdpi' },
  { name: 'ic_launcher.png', size: 192, density: 'xxxhdpi' },
  { name: 'ic_launcher_round.png', size: 48, density: 'mdpi' },
  { name: 'ic_launcher_round.png', size: 72, density: 'hdpi' },
  { name: 'ic_launcher_round.png', size: 96, density: 'xhdpi' },
  { name: 'ic_launcher_round.png', size: 144, density: 'xxhdpi' },
  { name: 'ic_launcher_round.png', size: 192, density: 'xxxhdpi' },
];

const inputIcon = path.join(__dirname, '../src/assets/images/icon.png');

async function generateAndroidIcons() {
  console.log('Generating Android app icons...');

  for (const icon of androidIconSizes) {
    const outputDir = path.join(__dirname, `../android/app/src/main/res/mipmap-${icon.density}`);
    const outputPath = path.join(outputDir, icon.name);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
      await sharp(inputIcon)
        .resize(icon.size, icon.size)
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated ${icon.name} (${icon.size}x${icon.size}) for ${icon.density}`);
    } catch (error) {
      console.error(`❌ Failed to generate ${icon.name} for ${icon.density}:`, error.message);
    }
  }

  console.log('🎉 All Android app icons generated successfully!');
}

generateAndroidIcons().catch(console.error);
