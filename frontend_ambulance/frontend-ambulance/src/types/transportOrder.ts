export type TransportOrderResponse = {
  id: number;
  orderNumber: string | null;
  orderType: string;
  source: string;
  createdById: number;
  createdByFullName: string;
  createdByRole: string;
  status: string;
  priority: string;
  description: string | null;
  createdAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelledById: number | null;
  cancelReason: string | null;
  cancelDescription: string | null;
  anonymizedAt: string | null;
};