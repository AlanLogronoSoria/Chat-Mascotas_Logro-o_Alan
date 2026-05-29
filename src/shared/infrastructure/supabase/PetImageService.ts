import * as ImagePicker from 'expo-image-picker';
import { supabase } from './client';
import { StorageService } from './StorageService';
import { StorageError } from '../../domain/errors/AppError';

type FileInput = { uri: string; name: string; type: string };

const BUCKET = 'pet_images';

export class PetImageService {
  static async requestPermission(): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }

  static async pickImage(): Promise<ImagePicker.ImagePickerAsset | null> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    return result.assets[0];
  }

  static async uploadPetImage(file: FileInput, petId: string): Promise<string> {
    try {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${petId}/${timestamp}_${safeName}`;

      return await StorageService.uploadFile(BUCKET, path, file);
    } catch (e) {
      if (e instanceof StorageError) throw e;
      throw new StorageError('Error al subir imagen de mascota', e);
    }
  }

  static async deletePetImage(imageUrl: string): Promise<void> {
    if (!imageUrl) return;

    try {
      const path = StorageService.extractPathFromUrl(BUCKET, imageUrl);
      if (!path) return;

      await StorageService.deleteFile(BUCKET, path);
    } catch (e) {
      if (e instanceof StorageError) throw e;
      throw new StorageError('Error al eliminar imagen de mascota', e);
    }
  }

  static async updatePetImage(
    oldUrl: string,
    newFile: FileInput,
    petId: string
  ): Promise<string> {
    try {
      if (oldUrl) {
        try {
          await this.deletePetImage(oldUrl);
        } catch {
          // Continue even if delete fails
        }
      }

      return await this.uploadPetImage(newFile, petId);
    } catch (e) {
      if (e instanceof StorageError) throw e;
      throw new StorageError('Error al actualizar imagen de mascota', e);
    }
  }
}
