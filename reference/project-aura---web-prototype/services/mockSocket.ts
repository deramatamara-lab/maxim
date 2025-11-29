import { RideStatus, Coordinates } from '../types';

export interface RideUpdate {
    status: RideStatus;
    eta?: number;
    location?: Coordinates;
}

export type RideUpdateCallback = (update: RideUpdate) => void;

export class MockRideSocket {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private status: RideStatus = 'confirmed';
  private eta: number = 4;
  
  // Simulating movement from point A (Driver Start) to B (User Location)
  private startLocation = { lat: 34.0560, lng: -118.2470 }; 
  private userLocation = { lat: 34.0522, lng: -118.2437 };
  private currentLocation = { ...this.startLocation };

  connect(onUpdate: RideUpdateCallback) {
    let progress = 0;
    const speed = 0.002; // Progress increment per tick (slower for realism)

    // Initial State
    onUpdate({ 
        status: 'confirmed', 
        eta: this.eta,
        location: this.currentLocation
    });

    this.intervalId = setInterval(() => {
      progress += speed;
      
      // Update Location (Linear Interpolation)
      if (progress <= 1) {
          this.currentLocation = {
              lat: this.startLocation.lat + (this.userLocation.lat - this.startLocation.lat) * progress,
              lng: this.startLocation.lng + (this.userLocation.lng - this.startLocation.lng) * progress
          };
      }

      // Status Logic
      if (progress > 0.2 && this.status === 'confirmed') {
        this.status = 'arriving';
        this.eta = 3;
      }
      
      if (progress > 0.5 && this.eta > 2) {
          this.eta = 2;
      }

      if (progress > 0.8 && this.eta > 1) {
           this.eta = 1;
      }

      if (progress >= 0.95 && this.status === 'arriving') {
          this.status = 'arriving'; // Driver practically here
          this.eta = 0;
      }

      if (progress >= 1 && this.status !== 'in_progress' && this.status !== 'completed') {
        this.status = 'in_progress';
      }

      // Mock completion after some time in progress (simulating the ride itself)
      if (progress > 1.2 && this.status === 'in_progress') {
          // Keep moving "past" or "around" for a bit before completion
          this.status = 'completed';
          this.disconnect();
      }

      onUpdate({
          status: this.status,
          eta: Math.max(0, this.eta),
          location: this.currentLocation
      });

    }, 50); // 50ms updates for 60fps-like smooth animation
  }

  disconnect() {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}