export type WorkOrderType = {
  dueDate?: Date;
  paidAt?: Date;
  status?: string;
  itemName?: string;
  comments?: string;
  labor?: number;
  parts?: number;
  mechanic?: string;
  miles?: number;
};
