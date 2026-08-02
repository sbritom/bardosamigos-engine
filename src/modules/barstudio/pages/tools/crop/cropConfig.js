import { INITIAL_IMAGE_DECORATION } from '../../../image-tools'

export const CROP_PREVIEW_SIZE = 720
export const INITIAL_CROP_SETTINGS = {
  border: { ...INITIAL_IMAGE_DECORATION.border },
  shadow: { ...INITIAL_IMAGE_DECORATION.shadow },
}

export function getCropExportSize(image, quality) {
  const original = Math.min(image.naturalWidth || image.width, image.naturalHeight || image.height)
  if (quality === 'high') return Math.min(original, 2048)
  if (quality === 'medium') return Math.min(original, 1280)
  if (quality === 'low') return Math.min(original, 720)
  return original
}
