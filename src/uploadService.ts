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

export async function uploadWeddingPhotos(guestName: string, files: File[]) {
  if (!supabase) {
    throw new Error('Supabase ainda não foi configurado. Confira o arquivo .env.');
  }

  const uploadedItems = [];
  const guestFolder = sanitizeGuestName(guestName);

  for (const file of files) {
    const cleanFileName = sanitizeFileName(file.name);
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}-${cleanFileName}`;
    const filePath = `${EVENT_SLUG}/fotos/${guestFolder}/${uniqueName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'image/jpeg',
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
        file_type: file.type || 'image/jpeg',
        file_size: file.size,
      });

    if (insertError) {
      throw new Error(`Foto enviada, mas não foi registrada no banco: ${insertError.message}`);
    }

    uploadedItems.push({ filePath, publicUrl: publicUrlData.publicUrl });
  }

  return uploadedItems;
}
