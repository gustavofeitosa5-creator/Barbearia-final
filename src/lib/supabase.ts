import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Bucket usado para fotos de barbeiros no schema atual.
export const PROFILE_BUCKET = 'barbers';
export const AVATAR_BUCKET = 'avatars';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function normalizeStoragePath(path: string) {
  return String(path)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\\+/g, '/')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._\/-]/g, '_')
    .replace(/\/+/g, '/')
    .replace(/__+/g, '_')
    .replace(/^[_\-.]+|[_\-.]+$/g, '');
}

export async function uploadProfileImage(file: File, path: string) {
  const isPlaceholder = supabaseUrl.includes('your-project') || supabaseAnonKey.includes('your-anon-key');
  if (isPlaceholder) {
    return { data: null, error: { message: 'Supabase environment not configured for uploads.' } } as any;
  }

  const normalizedPath = normalizeStoragePath(path);

  try {
    const { data, error } = await supabase.storage.from(AVATAR_BUCKET).upload(normalizedPath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'application/octet-stream',
    });
    if (error) {
      return { data: null, error } as any;
    }
    return { data, error: null } as any;
  } catch (err: any) {
    console.error('uploadProfileImage error', err);
    return { data: null, error: { message: err?.message ?? String(err) } } as any;
  }
}

export function getProfilePublicUrl(path: string) {
  const normalizedPath = normalizeStoragePath(path);
  const result = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(normalizedPath);
  return result.data?.publicUrl ?? '';
}

export async function uploadToBucket(bucket: string, path: string, file: File) {
  const isPlaceholder = supabaseUrl.includes('your-project') || supabaseAnonKey.includes('your-anon-key');
  if (isPlaceholder) {
    throw new Error('Supabase environment not configured for uploads.');
  }

  const normalizedPath = normalizeStoragePath(path);
  const { error } = await supabase.storage.from(bucket).upload(normalizedPath, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type || 'application/octet-stream',
  });

  if (error) {
    throw error;
  }

  const publicResult = supabase.storage.from(bucket).getPublicUrl(normalizedPath);
  if (!publicResult.data?.publicUrl) {
    throw new Error('Não foi possível obter a URL pública do arquivo.');
  }

  return publicResult.data.publicUrl;
}

export function getPublicUrl(bucket: string, path: string) {
  const normalizedPath = normalizeStoragePath(path);
  const result = supabase.storage.from(bucket).getPublicUrl(normalizedPath);
  return result.data?.publicUrl ?? '';
}

export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
};

export default supabase;
