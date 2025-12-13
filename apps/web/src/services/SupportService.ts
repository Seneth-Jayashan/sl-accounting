import api from "./api";

export interface SupportMessage {
  _id: string;
  name: string;
  gmail: string;
  phoneNumber: number;
  message: string;
  reply?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ListResponse {
  Ms: SupportMessage[];
}

export interface ItemResponse {
  Ms: SupportMessage;
}

const list = async (): Promise<SupportMessage[]> => {
  const { data } = await api.get<ListResponse>("/contact");
  return data.Ms ?? [];
};

const get = async (id: string): Promise<SupportMessage> => {
  const { data } = await api.get<ItemResponse>(`/contact/${id}`);
  return data.Ms;
};

const reply = async (
  id: string,
  payload: Pick<SupportMessage, "name" | "gmail" | "phoneNumber" | "message"> & { reply: string }
): Promise<SupportMessage> => {
  const { data } = await api.put<ItemResponse>(`/contact/${id}`, payload);
  return data.Ms;
};
const remove = async (id: string): Promise<void> => {
  await api.delete(`/contact/${id}`);
};

export const SupportService = { list, get, reply, remove };
export default SupportService;
