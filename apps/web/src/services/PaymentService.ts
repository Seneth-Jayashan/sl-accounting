import { api } from "./api";

const BASE_URL = "/payments";

// --- TYPES ---

// Full PayHere configuration object expected by the frontend checkout script
export interface PayHereInitResponse {
  merchant_id: string;
  hash: string;
  order_id: string;
  amount: string;
  currency: string;
  // Backend often returns these pre-filled for the SDK
  return_url?: string;
  cancel_url?: string;
  notify_url?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
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
  
  // Specific data for different methods
  slipUrl?: string;       // For Bank Transfers
  transactionId?: string; // For PayHere
  notes?: string;
}

export interface ManualPaymentPayload {
  enrollment: string; // Enrollment ID
  amount: number;
  notes?: string;
}

// --- SERVICE ---

const PaymentService = {
  /**
   * Step 1: Request Payment Hash from Backend
   * The backend generates the secure hash using the Merchant Secret
   */
  initiatePayHere: async (enrollmentId: string, amount: number) => {
    // Note: We send enrollmentId so backend can verify the correct price
    const response = await api.post<PayHereInitResponse>(`${BASE_URL}/initiate`, {
      enrollmentId,
      amount, 
      currency: "LKR"
    });
    return response.data;
  },

  /**
   * Submit a Bank Transfer Slip (Multipart)
   * This handles both creating the payment record AND uploading the file
   */
  uploadPaymentSlip: async (enrollmentId: string, file: File, notes?: string) => {
    const formData = new FormData();
    formData.append("enrollmentId", enrollmentId);
    formData.append("slip", file); 
    if (notes) formData.append("notes", notes);

    // Axios automatically sets 'Content-Type': 'multipart/form-data'
    const response = await api.post<{ success: boolean; payment: PaymentData }>(
      `${BASE_URL}/upload-slip`, 
      formData
    );
    return response.data;
  },

  /**
   * Get all payments (Admin Dashboard)
   */
  getAllPayments: async (status?: string) => {
    const params = status && status !== "all" ? { status } : {};
    const response = await api.get<PaymentData[]>(BASE_URL, { params });
    return response.data;
  },

  /**
   * Verify a Bank Transfer (Admin Only)
   * Security: Backend MUST check for Admin Role
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