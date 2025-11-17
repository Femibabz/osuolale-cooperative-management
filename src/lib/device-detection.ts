import { DeviceInfo } from '@/types';

export function detectDevice(): DeviceInfo {
  const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '';
  
  // Detect browser
  let browser = 'Unknown';
  if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge';
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    browser = 'Opera';
  }

  // Detect OS
  let os = 'Unknown';
  if (userAgent.includes('Win')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
  }

  // Detect device type
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    deviceType = 'tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
    deviceType = 'mobile';
  }

  // Get screen resolution
  const screenResolution = typeof window !== 'undefined' 
    ? `${window.screen.width}x${window.screen.height}`
    : 'Unknown';

  return {
    browser,
    os,
    deviceType,
    screenResolution,
    userAgent,
  };
}
