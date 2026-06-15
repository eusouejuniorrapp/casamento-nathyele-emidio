import { supabase } from './supabaseClient';
import { BUCKET_NAME, EVENT_SLUG } from './config';

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

function sanitizeGuestName(name: string) {
  return name
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
    .slice(0, 50) || 'convidado';
}

function isVideoFile(file: File) {
  const fileName = file.name.toLowerCase();
  return file.type.startsWith('video/') || /\.(mp4|mov|m4v|webm)$/i.test(fileName);
}

function getFallbackContentType(file: File) {
  const fileName = file.name.toLowerCase();

  if (file.type) return file.type;
  if (fileName.endsWith('.mov')) return 'video/quicktime';
  if (fileName.endsWith('.mp4') || fileName.endsWith('.m4v')) return 'video/mp4';
  if (fileName.endsWith('.webm')) return 'video/webm';
  if (fileName.endsWith('.png')) return 'image/png';
  if (fileName.endsWith('.webp')) return 'image/webp';
  if (fileName.endsWith('.heic')) return 'image/heic';
  if (fileName.endsWith('.heif')) return 'image/heif';

  return 'image/jpeg';
}

export async function uploadWeddingMedia(guestName: string, files: File[]) {
  if (!supabase) {
    throw new Error('Supabase ainda não foi configurado. Confira o arquivo .env.');
  }

  const uploadedItems = [];
  const guestFolder = sanitizeGuestName(guestName);

  for (const file of files) {
    const cleanFileName = sanitizeFileName(file.name);
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}-${cleanFileName}`;
    const mediaFolder = isVideoFile(file) ? 'videos' : 'fotos';
    const filePath = `${EVENT_SLUG}/${mediaFolder}/${guestFolder}/${uniqueName}`;
    const contentType = getFallbackContentType(file);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType,
      });

    if (uploadError) {
      throw new Error(`Erro ao enviar ${file.name}: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    const { error: insertError } = await supabase
      .from('wedding_uploads')
      .insert({
        event_slug: EVENT_SLUG,
        guest_name: guestName.trim(),
        file_name: file.name,
        file_path: filePath,
        file_url: publicUrlData.publicUrl,
        file_type: contentType,
        file_size: file.size,
      });

    if (insertError) {
      throw new Error(`Arquivo enviado, mas não foi registrado no banco: ${insertError.message}`);
    }

    uploadedItems.push({ filePath, publicUrl: publicUrlData.publicUrl });
  }

  return uploadedItems;
}

// Mantém o nome antigo para não quebrar nenhum import antigo.
export const uploadWeddingPhotos = uploadWeddingMedia;
