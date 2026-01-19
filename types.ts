
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
