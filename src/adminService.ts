import { supabase } from './supabaseClient';
import { EVENT_SLUG } from './config';

export type WeddingUpload = {
  id: string;
  guest_name: string;
  file_name: string;
  file_url: string;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
};

export async function listWeddingUploads() {
  if (!supabase) {
    throw new Error('Supabase ainda não foi configurado. Confira o arquivo .env.');
  }

  const { data, error } = await supabase
    .from('wedding_uploads')
    .select('id, guest_name, file_name, file_url, file_path, file_type, file_size, created_at')
    .eq('event_slug', EVENT_SLUG)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
