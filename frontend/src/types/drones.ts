export interface Drone {
    id: string;
    location: [number, number]; // [lat, lng]
    bearing: number; // 0-360 degrees
    status: 'IDLE' | 'MOVING' | 'DELIVERING' | 'RETURNING';
    missionId?: string;
    batteryLevel: number; // 0-100
    callsign: string;
}

export interface DroneUpdate {
    droneId: string;
    lat: number;
    lng: number;
    bearing?: number;
    status?: Drone['status'];
}
