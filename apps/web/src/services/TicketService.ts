import api from "./api";

export interface TicketPayload {
  user_id: string;
  name: string;
  gmail: string;
  phoneNumber: string;
  Categories: string;
  message: string;
  priority: string;
}

export interface TicketResponse {
  ticket: any;
}

const createTicket = async (payload: TicketPayload) => {
  const { data } = await api.post<TicketResponse>("/tickets", payload);
  return data.ticket;
};

const TicketService = {
  createTicket,
};

export default TicketService;
