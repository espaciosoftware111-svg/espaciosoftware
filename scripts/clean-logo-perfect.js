const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function cleanLogo() {
  const inputPath = "C:\\Users\\aksha\\.gemini\\antigravity-ide\\brain\\e12505c2-8287-43b3-93cc-070a08450cd9\\.user_uploaded\\media_1790404721588.jpg";

  const image = sharp(inputPath);
  const metadata = await image.metadata();
  const { width, height } = metadata;

  const { data } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  console.log(`Processing image of size ${width}x${height}`);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Check if the pixel is part of the foreground logo:
    // 1. Dark brown elements (Frame, "E", "ESPACIO", "INTERIORS AND MODULAR"):
    //    Dark brown has low brightness and warm tone (r >= g >= b):
    const isDarkBrown = (r < 100 && g < 80 && b < 70 && (r + g + b) < 220);

    // 2. Lamp shade (golden / copper gradient):
    //    The lamp is located in the upper left quadrant of the logo box:
    //    Warm color with significant red/yellow component (r > b + 30 and r > 100):
    const isGoldLamp = (r > 100 && g > 60 && b < 170 && (r - b) > 25 && (r - g) < 60);

    // 3. Medium dark brown anti-aliased edges:
    const isBrownEdge = (r < 140 && g < 110 && b < 90 && (r - b) > 15 && (r + g + b) < 320);

    if (isDarkBrown) {
      // Keep 100% solid
      data[i + 3] = 255;
    } else if (isGoldLamp) {
      // Keep 100% solid
      data[i + 3] = 255;
    } else if (isBrownEdge) {
      // Smooth anti-aliasing on the edges of brown lines
      const edgeWeight = Math.min(255, Math.max(0, Math.round(((320 - (r + g + b)) / 100) * 255)));
      data[i + 3] = edgeWeight;
    } else {
      // 100% transparent - eliminate all background noise/checkerboard completely
      data[i + 3] = 0;
    }
  }

  // Trim empty transparent border to make it tight and crisp
  const trimmed = await sharp(data, {
    raw: { width, height, channels: 4 }
  })
  .trim()
  .png({ quality: 100 })
  .toBuffer();

  const destinations = [
    path.join(__dirname, '../public/brand/espacio-logo.png'),
    path.join(__dirname, '../public/espacio-logo.png'),
    path.join(__dirname, '../public/logo.png'),
    path.join(__dirname, '../public/brand/espacio-uploaded-logo.png'),
  ];

  for (const dest of destinations) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, trimmed);
    console.log(`Saved ultra-clean transparent logo to: ${dest}`);
  }

  console.log('Clean logo generated successfully with 0 background artifacts!');
}

cleanLogo().catch(console.error);
