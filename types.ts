
export enum IntervalType {
  WALK = 'WALK',
  RUN = 'RUN',
  REST = 'REST'
}

export interface WorkoutInterval {
  id: string;
  type: IntervalType;
  duration: number; // em segundos
}

export interface WorkoutPlan {
  id: string;
  name: string;
  intervals: WorkoutInterval[];
}

export interface WorkoutSession {
  id: string;
  planId: string;
  planName: string;
  duration: number; // em segundos
  distance: number; // em metros
  date: number; // timestamp
  pace: number; // segundos por km
  path: { lat: number; lng: number }[];
}
