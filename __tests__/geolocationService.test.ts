import GeolocationService from '../src/services/geolocationService';
import { Platform } from 'react-native';

jest.mock('react-native-permissions', () => ({
  request: jest.fn(),
  PERMISSIONS: {
    IOS: { LOCATION_WHEN_IN_USE: 'ios_location' },
    ANDROID: { ACCESS_FINE_LOCATION: 'android_location' },
  },
  RESULTS: { GRANTED: 'granted', DENIED: 'denied' },
}));

jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn(),
}));

global.fetch = jest.fn();

describe('GeolocationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requests permissions and returns true if granted (iOS)', async () => {
    Platform.OS = 'ios';
    const { request, PERMISSIONS, RESULTS } = require('react-native-permissions');
    request.mockResolvedValue(RESULTS.GRANTED);
    const result = await (GeolocationService as any).requestPermissions();
    expect(result).toBe(true);
    expect(request).toHaveBeenCalledWith(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
  });

  it('requests permissions and returns false if denied (Android)', async () => {
    Platform.OS = 'android';
    const { request, PERMISSIONS, RESULTS } = require('react-native-permissions');
    request.mockResolvedValue(RESULTS.DENIED);
    const result = await (GeolocationService as any).requestPermissions();
    expect(result).toBe(false);
    expect(request).toHaveBeenCalledWith(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
  });

  it('sets userLocation with country info on successful geocoding', async () => {
    const geo = require('@react-native-community/geolocation');
    geo.getCurrentPosition.mockImplementation((success: Function) => {
      success({ coords: { latitude: 51.5, longitude: -0.1 } });
    });
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ address: { country_code: 'gb', country: 'United Kingdom' } }),
    });
    await (GeolocationService as any).getCurrentLocation();
    const loc = (GeolocationService as any).userLocation;
    expect(loc.countryCode).toBe('GB');
    expect(loc.countryName).toBe('United Kingdom');
    expect(loc.currency).toBe('GBP');
    expect(loc.currencySymbol).toBe('£');
    expect(loc.timezone).toBe('Europe/London');
    expect(loc.latitude).toBe(51.5);
    expect(loc.longitude).toBe(-0.1);
  });

  it('falls back to lat/lng if geocoding fails', async () => {
    const geo = require('@react-native-community/geolocation');
    geo.getCurrentPosition.mockImplementation((success: Function) => {
      success({ coords: { latitude: 10, longitude: 20 } });
    });
    (fetch as jest.Mock).mockRejectedValue(new Error('fail'));
    await expect((GeolocationService as any).getCurrentLocation()).rejects.toThrow('Failed to reverse geocode location');
    const loc = (GeolocationService as any).userLocation;
    expect(loc.latitude).toBe(10);
    expect(loc.longitude).toBe(20);
    expect(loc.countryCode).toBe('');
  });

  it('handles geolocation errors', async () => {
    const geo = require('@react-native-community/geolocation');
    geo.getCurrentPosition.mockImplementation((_: Function, error: Function) => {
      error({ message: 'denied' });
    });
    await expect((GeolocationService as any).getCurrentLocation()).rejects.toThrow('Failed to get current location: denied');
  });
}); 