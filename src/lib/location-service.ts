import { LocationInfo } from '@/types';

export async function getLocationInfo(): Promise<LocationInfo> {
  try {
    // Using ipapi.co for free IP geolocation (no API key needed)
    const response = await fetch('https://ipapi.co/json/');
    
    if (!response.ok) {
      throw new Error('Failed to fetch location');
    }
    
    const data = await response.json();
    
    return {
      ip: data.ip || 'Unknown',
      city: data.city || undefined,
      region: data.region || undefined,
      country: data.country_name || undefined,
      timezone: data.timezone || undefined,
      isp: data.org || undefined,
    };
  } catch (error) {
    console.error('Error fetching location:', error);
    // Fallback to basic info
    return {
      ip: 'Unknown',
      city: undefined,
      region: undefined,
      country: undefined,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      isp: undefined,
    };
  }
}

// Alternative function using a different service as backup
export async function getLocationInfoBackup(): Promise<LocationInfo> {
  try {
    // Using ip-api.com as backup (no API key needed, free for non-commercial use)
    const response = await fetch('http://ip-api.com/json/');
    
    if (!response.ok) {
      throw new Error('Failed to fetch location');
    }
    
    const data = await response.json();
    
    return {
      ip: data.query || 'Unknown',
      city: data.city || undefined,
      region: data.regionName || undefined,
      country: data.country || undefined,
      timezone: data.timezone || undefined,
      isp: data.isp || undefined,
    };
  } catch (error) {
    console.error('Error fetching location from backup:', error);
    return {
      ip: 'Unknown',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }
}
