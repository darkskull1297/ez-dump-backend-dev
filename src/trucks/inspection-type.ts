import { TruckInspectionType } from './truck-inspection-type';

export type Inspection = {
  reviewData: string;
  type: TruckInspectionType;
  duration: string;
  defects: number;
  jobId: string;
  location: any;
  punchId?: string;
};
