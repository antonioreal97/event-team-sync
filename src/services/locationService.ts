import { logger } from '@/utils/logger';

export interface Location {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
  address?: string;
}

export interface EventLocation extends Location {
  eventId: string;
  eventName: string;
  radiusKm: number; // Raio permitido para check-in
}

export interface UserLocation extends Location {
  userId: string;
  timestamp: Date;
  accuracy?: number; // Precisão do GPS em metros
}

export interface ProximityCheck {
  isWithinRange: boolean;
  distanceKm: number;
  allowedRadiusKm: number;
  userLocation: UserLocation;
  eventLocation: EventLocation;
}

class LocationService {
  private readonly EARTH_RADIUS_KM = 6371;

  /**
   * Calcula a distância entre duas coordenadas usando a fórmula de Haversine
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) * 
      Math.cos(this.degreesToRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return this.EARTH_RADIUS_KM * c;
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Verifica se o usuário está dentro do raio permitido do evento
   */
  checkProximity(
    userLocation: UserLocation,
    eventLocation: EventLocation
  ): ProximityCheck {
    const distance = this.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      eventLocation.latitude,
      eventLocation.longitude
    );

    return {
      isWithinRange: distance <= eventLocation.radiusKm,
      distanceKm: distance,
      allowedRadiusKm: eventLocation.radiusKm,
      userLocation,
      eventLocation
    };
  }

  /**
   * Obtém a localização atual do usuário via GPS
   */
  async getCurrentUserLocation(): Promise<UserLocation> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não suportada pelo navegador'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // Cache por 1 minuto
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation: UserLocation = {
            userId: 'current', // Será substituído pelo ID real do usuário
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(),
            city: 'Detectando...',
            state: 'Detectando...',
            country: 'Detectando...'
          };

          // Enriquecer com informações de endereço
          this.enrichLocationWithAddress(userLocation).then(resolve);
        },
        (error) => {
          reject(new Error(`Erro de geolocalização: ${error.message}`));
        },
        options
      );
    });
  }

  /**
   * Enriquece a localização com informações de endereço usando reverse geocoding
   */
  private async enrichLocationWithAddress(location: UserLocation): Promise<UserLocation> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&zoom=10`
      );
      
      if (!response.ok) {
        throw new Error('Falha ao obter endereço');
      }

      const data = await response.json();
      
      if (data.address) {
        location.city = data.address.city || data.address.town || data.address.village || 'Cidade desconhecida';
        location.state = data.address.state || data.address.province || 'Estado desconhecido';
        location.country = data.address.country || 'País desconhecido';
        location.address = data.display_name;
      }
    } catch (error) {
      console.warn('Não foi possível enriquecer localização com endereço:', error);
      // Manter valores padrão se falhar
    }

    return location;
  }

  /**
   * Obtém localização baseada no IP (fallback quando GPS não está disponível)
   */
  async getLocationByIP(): Promise<UserLocation> {
    try {
      // Obter IP
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      
      // Obter localização baseada no IP
      const geoResponse = await fetch(`https://ipapi.co/${ipData.ip}/json/`);
      const geoData = await geoResponse.json();
      
      return {
        userId: 'current',
        latitude: geoData.latitude || 0,
        longitude: geoData.longitude || 0,
        timestamp: new Date(),
        city: geoData.city || 'Cidade desconhecida',
        state: geoData.region || 'Estado desconhecido',
        country: geoData.country_name || 'País desconhecido',
        address: `${geoData.city}, ${geoData.region}, ${geoData.country_name}`
      };
    } catch (error) {
      throw new Error('Falha ao obter localização por IP');
    }
  }

  /**
   * Valida se uma localização está dentro de uma região específica
   */
  validateLocationInRegion(
    userLocation: UserLocation,
    allowedRegions: string[]
  ): boolean {
    const userRegion = `${userLocation.city}, ${userLocation.state}, ${userLocation.country}`;
    return allowedRegions.some(region => 
      userRegion.toLowerCase().includes(region.toLowerCase())
    );
  }

  /**
   * Formata distância para exibição amigável
   */
  formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    } else if (distanceKm < 10) {
      return `${distanceKm.toFixed(1)}km`;
    } else {
      return `${Math.round(distanceKm)}km`;
    }
  }

  /**
   * Obtém a localização mais precisa disponível (GPS > IP)
   */
  async getBestAvailableLocation(): Promise<UserLocation> {
    try {
      // Tentar GPS primeiro (mais preciso)
      return await this.getCurrentUserLocation();
    } catch (gpsError) {
      logger.debug('GPS não disponível, tentando IP:', gpsError);
      try {
        // Fallback para IP
        return await this.getLocationByIP();
      } catch (ipError) {
        throw new Error('Não foi possível obter localização (GPS e IP falharam)');
      }
    }
  }
}

export const locationService = new LocationService();
export default locationService;
