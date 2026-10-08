// Public app config. EXPO_PUBLIC_* values are inlined into the bundle at build
// time and must be read with static `process.env.X` access.

const awsRegion = process.env.EXPO_PUBLIC_AWS_REGION;
const locationApiKey = process.env.EXPO_PUBLIC_LOCATION_API_KEY;

export type MapStyleResult = { ok: true; url: string } | { ok: false; error: string };

// Amazon Location Service Maps API style descriptor (Standard style).
export function mapStyleUrl(): MapStyleResult {
  if (!awsRegion || !locationApiKey) {
    return {
      ok: false,
      error: 'Map is not configured: set EXPO_PUBLIC_AWS_REGION and EXPO_PUBLIC_LOCATION_API_KEY in app/.env',
    };
  }
  return {
    ok: true,
    url: `https://maps.geo.${awsRegion}.amazonaws.com/v2/styles/Standard/descriptor?key=${encodeURIComponent(locationApiKey)}&color-scheme=Light`,
  };
}
