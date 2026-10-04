const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function generateBrandAssets() {
  const inputPath = "C:\\Users\\aksha\\.gemini\\antigravity-ide\\brain\\e12505c2-8287-43b3-93cc-070a08450cd9\\.user_uploaded\\media_1790404721588.jpg";

  const image = sharp(inputPath);
  const metadata = await image.metadata();
  const { width, height } = metadata;

  const { data } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  console.log(`Analyzing original image of size ${width}x${height}...`);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Check if pixel is part of dark brown frame/text
    const isDarkBrown = (r < 110 && g < 85 && b < 75 && (r + g + b) < 230);

    // Check if pixel is part of the golden/copper lamp shade
    const isGoldLamp = (r > 95 && g > 55 && b < 160 && (r - b) > 20 && (r - g) < 65);

    // Smooth anti-aliased edge blending
    const isBrownEdge = (r < 145 && g < 115 && b < 95 && (r - b) > 12 && (r + g + b) < 325);

    if (isDarkBrown) {
      data[i + 3] = 255;
    } else if (isGoldLamp) {
      data[i + 3] = 255;
    } else if (isBrownEdge) {
      const edgeAlpha = Math.min(255, Math.max(0, Math.round(((325 - (r + g + b)) / 95) * 255)));
      data[i + 3] = edgeAlpha;
    } else {
      data[i + 3] = 0; // Completely transparent
    }
  }

  // 1. Clean Full Transparent Logo
  const cleanFullLogo = await sharp(data, {
    raw: { width, height, channels: 4 }
  })
  .trim()
  .png({ quality: 100 })
  .toBuffer();

  const publicDir = path.join(__dirname, '../public');
  const brandDir = path.join(publicDir, 'brand');

  fs.mkdirSync(brandDir, { recursive: true });

  // Save Full Logo
  fs.writeFileSync(path.join(brandDir, 'espacio-logo.png'), cleanFullLogo);
  fs.writeFileSync(path.join(publicDir, 'espacio-logo.png'), cleanFullLogo);
  fs.writeFileSync(path.join(publicDir, 'logo.png'), cleanFullLogo);
  fs.writeFileSync(path.join(brandDir, 'espacio-uploaded-logo.png'), cleanFullLogo);

  // 2. Extract Emblem Only (Upper Box with Lamp & E)
  const fullSharp = sharp(cleanFullLogo);
  const trimmedMeta = await fullSharp.metadata();
  const tWidth = trimmedMeta.width;
  const tHeight = trimmedMeta.height;

  // Emblem is the top ~68% of the trimmed graphic
  const emblemHeight = Math.round(tHeight * 0.68);
  const emblemBuffer = await sharp(cleanFullLogo)
    .extract({ left: 0, top: 0, width: tWidth, height: emblemHeight })
    .trim()
    .png({ quality: 100 })
    .toBuffer();

  fs.writeFileSync(path.join(brandDir, 'espacio-emblem.png'), emblemBuffer);
  fs.writeFileSync(path.join(publicDir, 'emblem.png'), emblemBuffer);

  console.log('Successfully generated clean transparent brand assets:');
  console.log('- Full Transparent Logo: /logo.png & /brand/espacio-logo.png');
  console.log('- Transparent Emblem: /brand/espacio-emblem.png & /emblem.png');
}

generateBrandAssets().catch(console.error);
