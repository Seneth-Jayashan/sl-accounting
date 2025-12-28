import api from "./api";

export interface TicketPayload {
  user_id: string;
  name: string;
  email: string;
  phoneNumber: string;
  Categories: string;
  message: string;
  priority: string;
}

export interface TicketResponse {
  ticket: Ticket;
}

export interface Ticket {
  _id: string;
  name: string;
  user_id: string;
  email: string;
  phoneNumber: string;
  Categories: string;
  message: string;
  status?: string;
  priority?: string;
  createdAt?: string;
}

export interface TicketUpdatePayload {
  name?: string;
  email?: string;
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
  const { data } = await api.get<{ tickets: Ticket[] }>(`/tickets/tickets/${user_id}`);
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

const bulkDeleteTickets = async (ids: string[]) => {
  const uniqueIds = Array.from(new Set((ids || []).map(String).filter(Boolean)));
  const { data } = await api.delete<{ deletedIds: string[]; deletedCount: number }>(
    "/tickets/bulk",
    { data: { ids: uniqueIds } }
  );
  return data;
};

const TicketService = {
  createTicket,
  getTicketById,
  getTicketsByUser,
  getAllTickets,
  getOpenTicketForUser,
  updateTicket,
  deleteTicket,
  bulkDeleteTickets,
};

export default TicketService;
