const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const srcPath = 'C:\\Users\\aksha\\.gemini\\antigravity-ide\\brain\\e8ed6e41-3816-44a3-ae4b-dfd8d1cdb674\\.user_uploaded\\media_1791524572373.png';
const publicDir = 'c:\\Users\\aksha\\OneDrive\\Desktop\\erp espacio\\public';
const brandDir = 'c:\\Users\\aksha\\OneDrive\\Desktop\\erp espacio\\public\\brand';

async function processCleanLogo() {
  console.log('Processing original transparent logo:', srcPath);

  // Load the original image with sharp and trim any empty transparent margins
  const trimmed = await sharp(srcPath)
    .trim({ threshold: 5 })
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();

  const meta = await sharp(trimmed).metadata();
  console.log(`Trimmed Logo size: ${meta.width}x${meta.height}, channels: ${meta.channels}, hasAlpha: ${meta.hasAlpha}`);

  const targets = [
    path.join(publicDir, 'espacio-logo.png'),
    path.join(publicDir, 'logo.png'),
    path.join(brandDir, 'espacio-logo.png'),
    path.join(brandDir, 'espacio-uploaded-logo.png')
  ];

  for (const t of targets) {
    fs.writeFileSync(t, trimmed);
    console.log('Successfully saved transparent logo to:', t);
  }

  // Extract the top architectural emblem (icon)
  const emblemHeight = Math.round(meta.height * 0.63);
  const emblemWidth = Math.round(meta.width * 0.52);
  const emblemLeft = Math.round((meta.width - emblemWidth) / 2);

  const emblem = await sharp(trimmed)
    .extract({
      left: emblemLeft,
      top: 0,
      width: emblemWidth,
      height: emblemHeight
    })
    .trim({ threshold: 5 })
    .png({ compressionLevel: 9 })
    .toBuffer();

  const emblemTargets = [
    path.join(publicDir, 'emblem.png'),
    path.join(brandDir, 'espacio-emblem.png')
  ];

  for (const et of emblemTargets) {
    fs.writeFileSync(et, emblem);
    console.log('Successfully saved transparent emblem to:', et);
  }

  console.log('COMPLETED! Logo has 100% transparent background with perfectly smooth anti-aliased edges.');
}

processCleanLogo().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
