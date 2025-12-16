import api from "./api";

interface PayHereInitResponse {
  merchant_id: string;
  hash: string;
  amount: string;
  currency: string;
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
};

export default PaymentService;