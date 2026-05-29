import { supabase } from '../../../../shared/infrastructure/supabase/client';

export interface ShelterLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  petsCount: number;
  phone: string;
}

const MOCK_SHELTERS: ShelterLocation[] = [
  { id: 'mock-1', name: 'Refugio Patitas Felices', lat: -0.180653, lng: -78.467834, address: 'Av. Amazonas N36-152, Quito', petsCount: 15, phone: '+593 99 765 4321' },
  { id: 'mock-2', name: 'Albergue Huellitas de Luz', lat: -0.210580, lng: -78.491072, address: 'Calle La Niña 430, La Floresta', petsCount: 22, phone: '+593 98 234 5678' },
  { id: 'mock-3', name: 'Asociación Arca de Noé', lat: -0.229486, lng: -78.514923, address: 'Av. 6 de Diciembre N24-631, La Mariscal', petsCount: 8, phone: '+593 99 556 6778' },
  { id: 'mock-4', name: 'Hogar San Roque', lat: -0.196341, lng: -78.501256, address: 'Calle Versalles 234, Santa Clara', petsCount: 31, phone: '+593 98 322 1456' },
  { id: 'mock-5', name: 'Centro Kuyay', lat: -0.172834, lng: -78.483901, address: 'Av. Colón E6-104, El Ejido', petsCount: 17, phone: '+593 99 788 9123' },
];

export class ShelterLocationRepository {
  async getAllShelters(): Promise<ShelterLocation[]> {
    const shelters: ShelterLocation[] = [];

    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, username, latitude, longitude, address, phone');

      if (!error && profiles) {
        const sheltersWithLocation = profiles.filter(
          (p: any) => p.latitude != null && p.longitude != null
        );

        for (const p of sheltersWithLocation) {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', p.id);

          shelters.push({
            id: p.id,
            name: p.username || 'Refugio',
            lat: p.latitude,
            lng: p.longitude,
            address: p.address || '',
            petsCount: count || 0,
            phone: p.phone || '',
          });
        }
      }
    } catch (e) {
      console.warn('No se pudieron obtener las ubicaciones de refugios:', e);
    }

    return shelters.length > 0 ? shelters : MOCK_SHELTERS;
  }
}
