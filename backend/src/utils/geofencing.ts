export interface Coordinates {
  lat: number;
  lng: number;
}

export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(point2.lat - point1.lat);
  const dLng = toRad(point2.lng - point1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) *
      Math.cos(toRad(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

export function isWithinRadius(
  point: Coordinates,
  center: Coordinates,
  radiusKm: number
): boolean {
  return calculateDistance(point, center) <= radiusKm;
}
