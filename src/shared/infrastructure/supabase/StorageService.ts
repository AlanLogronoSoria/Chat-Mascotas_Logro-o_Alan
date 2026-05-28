import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './client';

export async function pickAndUploadImage(): Promise<string | null> {
  // Pedir permiso a la galería
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Se necesita permiso para acceder a la galería');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images, // ✅ más compatible
    allowsEditing: true,
    quality: 0.7,
    base64: true, // ✅ pedir base64 directo desde el picker
  });

  if (result.canceled || !result.assets || result.assets.length === 0) return null;

  const asset = result.assets[0];

  // ✅ Usar base64 directo del asset si está disponible
  let base64: string;
  if (asset.base64) {
    base64 = asset.base64;
  } else if (asset.uri) {
    // Fallback: leer desde el sistema de archivos
    base64 = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystemEncodingType.Base64,
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

  const { data } = supabase.storage
    .from('chat-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}