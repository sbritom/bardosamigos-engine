import { clamp, INITIAL_IMAGE_DECORATION } from '../../../image-tools'

export const AVATAR_PREVIEW_SIZE = 720
export const AVATAR_SIZES = [128, 256, 512, 1024, 2048]

export const AVATAR_PRESETS = {
  discord: { label: 'Discord', shape: 'circle', size: 512, quality: 'high' },
  whatsapp: { label: 'WhatsApp', shape: 'circle', size: 512, quality: 'high' },
  instagram: { label: 'Instagram', shape: 'square', size: 1080, quality: 'high' },
  facebook: { label: 'Facebook', shape: 'square', size: 1024, quality: 'high' },
  steam: { label: 'Steam', shape: 'square', size: 512, quality: 'high' },
  xat: { label: 'Xat', shape: 'square', size: 128, quality: 'high' },
}

export const INITIAL_AVATAR_SETTINGS = {
  shape: 'circle',
  size: 512,
  customSize: 512,
  background: {
    type: 'transparent',
    color1: '#056CF2',
    color2: '#031326',
    angle: 135,
    image: null,
  },
  border: { ...INITIAL_IMAGE_DECORATION.border },
  shadow: { ...INITIAL_IMAGE_DECORATION.shadow },
  frame: 'none',
}

export function getAvatarOutputSize(settings) {
  return clamp(settings.size === 'custom' ? settings.customSize : settings.size, 64, 4096)
}
