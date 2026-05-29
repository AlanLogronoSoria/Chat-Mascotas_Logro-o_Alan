import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './client';
import { StorageError } from '../../domain/errors/AppError';

type FileInput = { uri: string; name: string; type: string };

export class StorageService {
  static async uploadFile(bucket: string, path: string, file: FileInput): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, decode(base64), {
          contentType: file.type,
          upsert: false,
        });

      if (error) throw new StorageError(`Error al subir archivo: ${error.message}`, error);

      return this.getPublicUrl(bucket, path);
    } catch (e) {
      if (e instanceof StorageError) throw e;
      throw new StorageError('Error inesperado al subir archivo', e);
    }
  }

  static async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw new StorageError(`Error al eliminar archivo: ${error.message}`, error);
    } catch (e) {
      if (e instanceof StorageError) throw e;
      throw new StorageError('Error inesperado al eliminar archivo', e);
    }
  }

  static getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data?.publicUrl || '';
  }

  static extractPathFromUrl(bucket: string, url: string): string | null {
    try {
      const encoded = encodeURIComponent(bucket);
      const regex = new RegExp(`/${encoded}/[^?]+`);
      const match = url.match(regex);
      if (!match) return null;

      return decodeURIComponent(match[0].replace(`/${encoded}/`, ''));
    } catch {
      return null;
    }
  }
}

export async function pickAndUploadImage(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Se necesita permiso para acceder a la galería');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.7,
    base64: true,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) return null;

  const asset = result.assets[0];

  let base64: string;
  if (asset.base64) {
    base64 = asset.base64;
  } else if (asset.uri) {
    base64 = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } else {
    throw new Error('No se pudo obtener la imagen');
  }

  const ext = asset.uri?.split('.').pop()?.toLowerCase() ?? 'jpg';
  const fileName = `${Date.now()}.${ext}`;
  const filePath = `public/${fileName}`;

  const { error } = await supabase.storage
    .from('chat-images')
    .upload(filePath, decode(base64), {
      contentType: `image/${ext}`,
      upsert: false,
    });

  if (error) throw new Error(error.message);

  const { data: urlData } = supabase.storage
    .from('chat-images')
    .getPublicUrl(filePath);

  return urlData?.publicUrl || null;
}
