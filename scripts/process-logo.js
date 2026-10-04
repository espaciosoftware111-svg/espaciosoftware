const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function processLogo() {
  const inputPath = "C:\\Users\\aksha\\.gemini\\antigravity-ide\\brain\\e12505c2-8287-43b3-93cc-070a08450cd9\\.user_uploaded\\media_1790404721588.jpg";
  
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  const { width, height } = metadata;
  
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
    
  console.log(`Image size: ${width}x${height}, channels: ${info.channels}`);

  // Process raw RGBA buffer to make checkerboard background transparent
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Check if pixel belongs to gray/white checkerboard background:
    // Checkerboard squares are achromatic (r ~= g ~= b) and bright (lightness > 150)
    const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    const avg = (r + g + b) / 3;

    // Check for checkerboard background:
    // White squares: avg > 230
    // Gray squares: avg > 160 && maxDiff < 18
    if (avg > 235 && maxDiff < 15) {
      data[i + 3] = 0; // 100% transparent
    } else if (avg > 160 && maxDiff < 20) {
      data[i + 3] = 0; // 100% transparent
    } else if (avg > 140 && maxDiff < 14) {
      // Soft transition / feathering
      const alpha = Math.min(255, Math.max(0, Math.round(((160 - avg) / 20) * 255)));
      data[i + 3] = alpha;
    }
  }

  const processedBuffer = await sharp(data, {
    raw: {
      width,
      height,
      channels: 4
    }
  })
  .png({ quality: 100 })
  .toBuffer();

  // Save to all required destinations in public/ and public/brand/
  const destinations = [
    path.join(__dirname, '../public/brand/espacio-logo.png'),
    path.join(__dirname, '../public/espacio-logo.png'),
    path.join(__dirname, '../public/logo.png'),
    path.join(__dirname, '../public/brand/espacio-uploaded-logo.png'),
  ];

  for (const dest of destinations) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, processedBuffer);
    console.log(`Saved transparent logo to: ${dest}`);
  }

  console.log('Logo processing completed successfully!');
}

processLogo().catch(console.error);
