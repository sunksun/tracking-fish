import * as Location from 'expo-location';

export class LocationService {
  static async requestPermission() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  static async getCurrentLocation() {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000,
        maximumAge: 10000,
      });
      
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        timestamp: new Date(location.timestamp)
      };
    } catch (error) {
      console.error('Get location error:', error);
      return null;
    }
  }

  static async reverseGeocode(latitude, longitude) {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });
      
      if (results.length > 0) {
        const result = results[0];
        return {
          village: result.subLocality || result.district || '',
          district: result.city || result.subAdministrativeArea || '',
          province: result.region || '',
          country: result.country || 'ไทย',
          formattedAddress: this.formatAddress(result)
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  static formatAddress(geocodeResult) {
    const parts = [];
    
    if (geocodeResult.subLocality) parts.push(geocodeResult.subLocality);
    if (geocodeResult.district) parts.push(geocodeResult.district);
    if (geocodeResult.city) parts.push(geocodeResult.city);
    if (geocodeResult.region) parts.push(geocodeResult.region);
    if (geocodeResult.country) parts.push(geocodeResult.country);
    
    return parts.join(', ') || 'ไม่สามารถระบุที่อยู่ได้';
  }

  static formatCoordinates(latitude, longitude) {
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }

  // คำนวณระยะทางระหว่าง 2 จุด (Haversine formula)
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  }

  // ตรวจสอบว่าอยู่ในบริเวณแม่น้ำโขงหรือไม่
  static isInMekongRegion(latitude, longitude) {
    // พื้นที่ประมาณของลุ่มแม่น้ำโขงในประเทศไทย
    const mekongBounds = {
      north: 20.5,
      south: 14.0,
      east: 105.0,
      west: 100.0
    };

    return (
      latitude >= mekongBounds.south &&
      latitude <= mekongBounds.north &&
      longitude >= mekongBounds.west &&
      longitude <= mekongBounds.east
    );
  }
}