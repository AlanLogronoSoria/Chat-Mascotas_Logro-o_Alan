import { create } from 'zustand';
import { supabase } from '../../../../shared/infrastructure/supabase/client';

export interface AdoptionApplication {
  id: string;
  petId: string;
  petName: string;
  petImage?: string;
  adopterId: string;
  adopterUsername: string;
  shelterId: string;
  status: 'enviada' | 'revisando' | 'entrevista' | 'aprobada' | 'rechazada';
  createdAt: Date;
  details?: string;
}

interface AdoptionStore {
  applications: AdoptionApplication[];
  addApplication: (app: AdoptionApplication) => void;
  updateStatus: (id: string, status: AdoptionApplication['status']) => void;
  setApplications: (apps: AdoptionApplication[]) => void;
}

// Global reactive state for adoption applications
export const useAdoptionStore = create<AdoptionStore>((set) => ({
  applications: [
    // Pre-populate with a demo application for excellent UI showcase
    {
      id: 'demo-app-1',
      petId: 'pet-demo-1',
      petName: 'Luna',
      petImage: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300&auto=format&fit=crop',
      adopterId: 'client-id',
      adopterUsername: 'adoptante@petadopt.com',
      shelterId: 'shelter-id',
      status: 'revisando',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      details: 'Familia con casa espaciosa y jardín cerrado.',
    }
  ],
  addApplication: (app) => set((state) => ({ applications: [...state.applications, app] })),
  updateStatus: (id, status) => set((state) => ({
    applications: state.applications.map((app) =>
      app.id === id ? { ...app, status } : app
    )
  })),
  setApplications: (apps) => set({ applications: apps }),
}));

export class AdoptionRepository {
  async getApplicationsForAdopter(adopterId: string): Promise<AdoptionApplication[]> {
    try {
      const { data, error } = await supabase
        .from('adoption_applications')
        .select('*')
        .eq('adopter_id', adopterId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped = data.map((d: any) => ({
          id: d.id,
          petId: d.pet_id,
          petName: d.pet_name,
          petImage: d.pet_image,
          adopterId: d.adopter_id,
          adopterUsername: d.adopter_username,
          shelterId: d.shelter_id,
          status: d.status,
          createdAt: new Date(d.created_at),
          details: d.details,
        }));
        useAdoptionStore.getState().setApplications(mapped);
        return mapped;
      }
    } catch (e) {
      console.warn("⚠️ Tabla de solicitudes de adopción no disponible en Supabase. Usando almacenamiento local.");
    }
    // Fallback to local store
    return useAdoptionStore.getState().applications.filter(a => a.adopterId === adopterId);
  }

  async getApplicationsForShelter(shelterId: string): Promise<AdoptionApplication[]> {
    try {
      const { data, error } = await supabase
        .from('adoption_applications')
        .select('*')
        .eq('shelter_id', shelterId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped = data.map((d: any) => ({
          id: d.id,
          petId: d.pet_id,
          petName: d.pet_name,
          petImage: d.pet_image,
          adopterId: d.adopter_id,
          adopterUsername: d.adopter_username,
          shelterId: d.shelter_id,
          status: d.status,
          createdAt: new Date(d.created_at),
          details: d.details,
        }));
        useAdoptionStore.getState().setApplications(mapped);
        return mapped;
      }
    } catch (e) {
      console.warn("⚠️ Tabla de solicitudes de adopción no disponible en Supabase. Usando almacenamiento local.");
    }
    // Fallback to local store (for demo purposes we match all if shelterId aligns)
    return useAdoptionStore.getState().applications;
  }

  async createApplication(application: Omit<AdoptionApplication, 'id' | 'createdAt' | 'status'>): Promise<AdoptionApplication> {
    const newApp: AdoptionApplication = {
      ...application,
      id: Math.random().toString(),
      status: 'enviada',
      createdAt: new Date(),
    };

    try {
      const { data, error } = await supabase
        .from('adoption_applications')
        .insert([{
          pet_id: application.petId,
          pet_name: application.petName,
          pet_image: application.petImage,
          adopter_id: application.adopterId,
          adopter_username: application.adopterUsername,
          shelter_id: application.shelterId,
          status: 'enviada',
          details: application.details,
        }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const savedApp = {
          id: data.id,
          petId: data.pet_id,
          petName: data.pet_name,
          petImage: data.pet_image,
          adopterId: data.adopter_id,
          adopterUsername: data.adopter_username,
          shelter_id: data.shelter_id,
          status: data.status,
          createdAt: new Date(data.created_at),
          details: data.details,
        };
        useAdoptionStore.getState().addApplication(savedApp);
        return savedApp;
      }
    } catch (e) {
      console.warn("⚠️ Error guardando en Supabase. Persistiendo localmente en memoria.");
    }

    useAdoptionStore.getState().addApplication(newApp);
    return newApp;
  }

  async updateApplicationStatus(id: string, status: AdoptionApplication['status']): Promise<void> {
    try {
      const { error } = await supabase
        .from('adoption_applications')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    } catch (e) {
      console.warn("⚠️ Error actualizando estado en Supabase. Actualizando en memoria.");
    }

    useAdoptionStore.getState().updateStatus(id, status);
  }
}
