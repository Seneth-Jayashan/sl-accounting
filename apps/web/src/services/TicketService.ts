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

export interface Ticket {
  _id: string;
  name: string;
  user_id: string;
  gmail: string;
  phoneNumber: string;
  Categories: string;
  message: string;
  status?: string;
  priority?: string;
  createdAt?: string;
}

export interface TicketUpdatePayload {
  name?: string;
  gmail?: string;
  phoneNumber?: string;
  Categories?: string;
  message?: string;
  status?: string;
  priority?: string;
}

const createTicket = async (payload: TicketPayload) => {
  const { data } = await api.post<TicketResponse>("/tickets", payload);
  return data.ticket;
};

const getTicketById = async (id: string) => {
  const { data } = await api.get<{ ticket: Ticket }>(`/tickets/ticket/${id}`);
  return data.ticket;
};

const getTicketsByUser = async (user_id: string) => {
  const { data } = await api.get<{ tickets: any[] }>(`/tickets/tickets/${user_id}`);
  return data.tickets;
};

const getAllTickets = async () => {
  const { data } = await api.get<{ tickets: Ticket[] }>("/tickets");
  return data.tickets;
};

const getOpenTicketForUser = async (user_id: string) => {
  const tickets = await getTicketsByUser(user_id);
  if (!tickets || tickets.length === 0) return null;
  const open = tickets.find((t) => !["closed", "close"].includes(String(t.status).toLowerCase()));
  return open ?? null;
};

const updateTicket = async (id: string, payload: TicketUpdatePayload) => {
  const { data } = await api.put<{ ticket: Ticket }>(`/tickets/${id}`, payload);
  return data.ticket;
};

const deleteTicket = async (id: string) => {
  const { data } = await api.delete<{ ticket: Ticket }>(`/tickets/ticket/${id}`);
  return data.ticket;
};

const TicketService = {
  createTicket,
  getTicketById,
  getTicketsByUser,
  getAllTickets,
  getOpenTicketForUser,
  updateTicket,
  deleteTicket,
};

export default TicketService;
