export type TaskOrderType = {
  isDeleted?: boolean,
  status?: string,
  title: string,
  description?: string,
  interval: number,
  milesToTask?: number,
  currentMiles?: number,
};
