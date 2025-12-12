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

const getTicketById = async (id: string) => {
  const { data } = await api.get<{ ticket: any }>(`/tickets/ticket/${id}`);
  return data.ticket;
};

const getTicketsByUser = async (user_id: string) => {
  const { data } = await api.get<{ tickets: any[] }>(`/tickets/tickets/${user_id}`);
  return data.tickets;
};

const getOpenTicketForUser = async (user_id: string) => {
  const tickets = await getTicketsByUser(user_id);
  if (!tickets || tickets.length === 0) return null;
  const open = tickets.find((t) => !["closed", "close"].includes(String(t.status).toLowerCase()));
  return open ?? null;
};

const TicketService = {
  createTicket,
  getTicketById,
  getTicketsByUser,
  getOpenTicketForUser,
};

export default TicketService;
