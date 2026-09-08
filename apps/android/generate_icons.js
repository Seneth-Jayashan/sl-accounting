const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

const SOURCE_ICON = '/home/sjay/Documents/GitHub/sl-accounting/apps/desktop/app-icon.png';
const ANDROID_RES_DIR = '/home/sjay/Documents/GitHub/sl-accounting/apps/android/android/app/src/main/res';

const ICON_SIZES = {
  'mdpi': 48,
  'hdpi': 72,
  'xhdpi': 96,
  'xxhdpi': 144,
  'xxxhdpi': 192,
};

async function generateIcons() {
  try {
    for (const [density, size] of Object.entries(ICON_SIZES)) {
      const image = await Jimp.read(SOURCE_ICON);
      const dirPath = path.join(ANDROID_RES_DIR, `mipmap-${density}`);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      image.resize({ w: size, h: size });
      
      const files = ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png'];
      for (const file of files) {
        await image.write(path.join(dirPath, file));
        console.log(`Generated ${path.join(dirPath, file)}`);
      }
    }
    console.log("All icons generated successfully.");
  } catch (err) {
    console.error("Error generating icons:", err);
    process.exit(1);
  }
}

generateIcons();
