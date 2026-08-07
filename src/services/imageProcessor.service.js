const sharp = require('sharp');

const VARIANTS = [
  { name: 'thumb', width: 96, height: 96, fit: 'cover', quality: 70 },
  { name: 'card', width: 320, height: 240, fit: 'cover', quality: 75 },
  { name: 'detail', width: 720, height: null, fit: 'inside', quality: 80 },
  { name: 'original', width: 1280, height: null, fit: 'inside', quality: 85 },
];

const generateBlurDataURL = async (buffer) => {
  try {
    const tiny = await sharp(buffer)
      .resize(16, 16, { fit: 'inside' })
      .webp({ quality: 30 })
      .toBuffer();
    return `data:image/webp;base64,${tiny.toString('base64')}`;
  } catch {
    return null;
  }
};

const buildImageVariants = async (buffer) => {
  const meta = await sharp(buffer).metadata();
  const blurDataURL = await generateBlurDataURL(buffer);

  const variants = {};
  for (const v of VARIANTS) {
    const pipeline = sharp(buffer).resize({
      width: v.width,
      height: v.height,
      fit: v.fit,
      withoutEnlargement: true,
    });
    variants[v.name] = await pipeline
      .webp({ quality: v.quality, effort: 4 })
      .toBuffer();
  }

  return {
    meta: { width: meta.width, height: meta.height, format: meta.format },
    blurDataURL,
    variants,
  };
};

const processFoodImage = async (buffer) => {
  if (!buffer?.length) throw new Error('Empty buffer');
  return buildImageVariants(buffer);
};

const getVariantBuffer = async (buffer, variantName) => {
  const v = VARIANTS.find((x) => x.name === variantName);
  if (!v) throw new Error(`Unknown variant: ${variantName}`);
  return sharp(buffer)
    .resize({
      width: v.width,
      height: v.height,
      fit: v.fit,
      withoutEnlargement: true,
    })
    .webp({ quality: v.quality })
    .toBuffer();
};

const VARIANT_NAMES = VARIANTS.map((v) => v.name);

module.exports = {
  processFoodImage,
  getVariantBuffer,
  generateBlurDataURL,
  VARIANT_NAMES,
};
