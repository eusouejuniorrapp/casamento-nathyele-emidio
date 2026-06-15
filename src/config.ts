export const EVENT_SLUG = 'nathyele-emidio';
export const BUCKET_NAME = 'wedding-media';

// Limites do envio
export const MAX_FILES = 10;
export const MAX_PHOTO_SIZE_MB = 10;
export const MAX_VIDEO_SIZE_MB = 50;
export const MAX_PHOTO_SIZE_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;
export const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

// Mantido para compatibilidade com partes antigas do app
export const MAX_FILE_SIZE_MB = MAX_PHOTO_SIZE_MB;
export const MAX_FILE_SIZE_BYTES = MAX_PHOTO_SIZE_BYTES;

export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

export const ACCEPTED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime', // .mov do iPhone
  'video/webm',
  'video/x-m4v',
  'video/m4v',
];

export const ACCEPTED_MEDIA_TYPES = [
  ...ACCEPTED_IMAGE_TYPES,
  ...ACCEPTED_VIDEO_TYPES,
];

export const ACCEPTED_FILE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.heic',
  '.heif',
  '.mp4',
  '.mov',
  '.m4v',
  '.webm',
];
