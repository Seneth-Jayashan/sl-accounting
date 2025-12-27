import { api } from "./api";

const BASE_URL = "/payments";

// --- TYPES ---

export interface PayHereInitResponse {
  merchant_id: string;
  hash: string;
  order_id: string;
  amount: string;
  currency: string;
}

export interface PaymentData {
  _id: string;
  enrollment: {
    _id: string;
    student: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber?: string;
    };
    class: {
      _id: string;
      name: string;
      price?: number;
    };
  };
  amount: number;
  currency: string;
  method: "payhere" | "bank_transfer" | "manual";
  status: "completed" | "pending" | "failed" | "refunded";
  paymentDate: string; // ISO String
  
  // Specific data
  rawPayload?: {
      slipUrl?: string;
  };
  payhere_payment_id?: string;
  transactionId?: string;
  notes?: string;
}

// --- SERVICE ---

const PaymentService = {
  /**
   * 1. Get Payment History for Logged-in User
   * Endpoint: GET /api/v1/payments/my-payments
   */
  getMyPayments: async () => {
    const response = await api.get<PaymentData[]>(`${BASE_URL}/my-payments`);
    return response.data;
  },

  /**
   * 2. Request Payment Hash from Backend (PayHere)
   * Endpoint: POST /api/v1/payments/initiate
   */
  initiatePayHere: async (amount: number, orderId: string) => {
    const response = await api.post<PayHereInitResponse>(`${BASE_URL}/initiate`, {
      amount, 
      order_id: orderId,
      currency: "LKR"
    });
    return response.data;
  },

  /**
   * 3. Submit a Bank Transfer Slip
   * Endpoint: POST /api/v1/payments/upload-slip
   */
  uploadPaymentSlip: async (enrollmentId: string, file: File, amount: number, notes?: string) => {
    const formData = new FormData();
    formData.append("enrollmentId", enrollmentId);
    

    formData.append("amount", amount.toString());

    
    // IMPORTANT: 'slip' must match the field name in your backend UploadMiddleware
    formData.append("slip", file); 
    
    if (notes) formData.append("notes", notes);

    const response = await api.post<{ success: boolean; payment: PaymentData }>(
      `${BASE_URL}/upload-slip`, 
      formData, 
      {
        // Force browser to set Content-Type to multipart/form-data with boundary
        // We set it to undefined so Axios/Browser auto-generates the boundary
        headers: {
          "Content-Type": "multipart/form-data" 
        }
      }
    );
    return response.data;
  },

  /**
   * 4. Get all payments (Admin Dashboard)
   * Endpoint: GET /api/v1/payments
   */
  getAllPayments: async (status?: string) => {
    const params = status && status !== "all" ? { status } : {};
    const response = await api.get<PaymentData[]>(BASE_URL, { params });
    return response.data;
  },

  /**
   * 5. Verify a Bank Transfer (Admin Only)
   * Endpoint: PUT /api/v1/payments/:id
   */
  verifyPayment: async (paymentId: string, action: "approve" | "reject") => {
    const status = action === "approve" ? "completed" : "failed";
    
    const response = await api.put<{ success: boolean; payment: PaymentData }>(
      `${BASE_URL}/${paymentId}`, 
      { status }
    ); 
    return response.data;
  },

  /**
   * 6. Create Manual Payment (Admin Only)
   * Endpoint: POST /api/v1/payments
   */
  createManualPayment: async (data: { enrollment: string; amount: number; transactionId?: string; notes?: string }) => {
    const response = await api.post<{ success: boolean; payment: PaymentData }>(
      BASE_URL, 
      data
    );
    return response.data;
  },

  /**
   * Helper to format currency
   */
  formatCurrency: (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount);
  }
};

export default PaymentService;