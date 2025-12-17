import api from "./api";

interface PayHereInitResponse {
  merchant_id: string;
  hash: string;
  amount: string;
  currency: string;
}

export interface PaymentData {
  _id: string;
  enrollment: {
    _id: string;
    student: {
      firstName: string;
      lastName: string;
      email: string;
    };
    class: {
      name: string;
    };
  };
  amount: number;
  method: "payhere" | "bank_transfer" | "manual";
  status: "completed" | "pending" | "failed";
  paymentDate: string;
  rawPayload?: {
    slipUrl?: string; // Where the uploaded image path is stored
  };
  notes?: string;
}

const PaymentService = {
  /**
   * Get the necessary Hash and Merchant ID from backend to start PayHere payment
   */
  initiatePayHere: async (amount: number, orderId: string, currency: string = "LKR") => {
    const response = await api.post<PayHereInitResponse>("/payments/initiate", {
      amount,
      order_id: orderId,
      currency
    });
    return response.data;
  },

  /**
   * Submit a manual payment (Bank Transfer Record)
   * Note: Usually students upload a slip. 
   * If your backend 'createPayment' sets status='completed', 
   * you might need to adjust backend to default to 'pending' for 'bank_transfer'.
   */
  submitBankTransfer: async (enrollmentId: string, amount: number, notes?: string) => {
    const response = await api.post("/payments", {
      enrollment: enrollmentId,
      amount,
      method: "bank_transfer",
      notes
    });
    return response.data;
  },

 uploadPaymentSlip: async (enrollmentId: string, file: File, notes?: string) => {
    const formData = new FormData();
    formData.append("enrollmentId", enrollmentId);
    formData.append("slip", file); // Must match upload.single("slip") in backend
    if (notes) formData.append("notes", notes);

    // REMOVED manual header. Let Axios handle the boundary.
    const response = await api.post("/payments/upload-slip", formData);
    return response.data;
  },

  getAllPayments: async (status?: string) => {
    const params = status && status !== "all" ? { status } : {};
    const response = await api.get<PaymentData[]>("/payments", { params });
    return response.data;
  },

  /**
   * Verify (Approve/Reject) a Bank Transfer
   * Endpoint: PUT /api/v1/payments/:id/verify
   * (You need to ensure your backend supports this, or use a generic update)
   */
  verifyBankSlip: async (id: string, action: "approve" | "reject") => {
    // Assuming you have a backend route for verification
    // If not, you might use a generic update: 
    // api.put(`/payments/${id}`, { status: action === 'approve' ? 'completed' : 'failed' })
    
    const status = action === "approve" ? "completed" : "failed";
    const response = await api.put(`/payments/${id}`, { status }); 
    return response.data;
  },
};

export default PaymentService;