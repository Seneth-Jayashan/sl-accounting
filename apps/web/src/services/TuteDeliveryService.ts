import { api } from "./api";

const BASE_URL = "/tute-delivery";

// --- TYPES ---

export interface TuteDeliveryData {
  _id: string;
  enrollment: string; // or Populated Enrollment object if needed
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    address?: string | {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      nearestPostOffice?: string;
    };
  };
  class: {
    _id: string;
    name: string;
  };
  payment?: string;
  targetMonth: string; // e.g., "2026-02"
  status: "pending" | "shipped" | "delivered";
  
  // Delivery Details
  sentAt?: string; // ISO Date
  trackingId?: string;
  courierService?: string;
  
  createdAt: string;
}

export interface PendingDeliveryParams {
  classId?: string;
  month?: string; // YYYY-MM format
}

export interface MarkSentPayload {
  trackingId?: string;
  courierService?: string; // Defaults to "SL Post" if omitted
}

export interface DeliveryFilters {
  status: "pending" | "shipped" | "delivered";
  filterType: "all_time" | "today" | "this_week" | "last_week" | "this_month" | "last_month" | "custom";
  startDate?: string;
  endDate?: string;
  classId?: string;
}

// --- SERVICE ---

const TuteDeliveryService = {

  getAllDeliveries: async (params: DeliveryFilters) => {
    const response = await api.get<TuteDeliveryData[]>(`${BASE_URL}`, { params });
    return response.data;
  },
  /**
   * 1. Get Pending Deliveries (Admin/Teacher)
   * Endpoint: GET /api/v1/tute-delivery/pending
   */
  getPendingDeliveries: async (params?: PendingDeliveryParams) => {
    const response = await api.get<TuteDeliveryData[]>(`${BASE_URL}/pending`, { params });
    return response.data;
  },

  /**
   * 2. Mark Tute as Sent (Admin/Teacher)
   * Endpoint: PUT /api/v1/tute-delivery/:id/mark-sent
   */
  markAsSent: async (id: string, data: MarkSentPayload) => {
    const response = await api.put<{ success: boolean; delivery: TuteDeliveryData }>(
      `${BASE_URL}/${id}/mark-sent`,
      data
    );
    return response.data;
  },

  /**
   * 3. Get My Delivery History (Student)
   * Endpoint: GET /api/v1/tute-delivery/my-deliveries
   */
  getMyDeliveries: async () => {
    const response = await api.get<TuteDeliveryData[]>(`${BASE_URL}/my-deliveries`);
    return response.data;
  },

  /**
   * 4. Mark Tute as Delivered (Student confirms receipt)
   * Endpoint: PUT /api/v1/tute-delivery/:id/mark-delivered
   */
  markAsDelivered: async (id: string) => {
    const response = await api.put<{ success: boolean; delivery: TuteDeliveryData }>(
      `${BASE_URL}/${id}/mark-delivered`
    );
    return response.data;
  }
};

export default TuteDeliveryService;