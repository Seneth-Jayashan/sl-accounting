import api from "./api";

export interface PaperSubmission {
  _id: string;
  student: any; // User object if populated
  paperName: string;
  year: number;
  examDetails: string;
  fileUrl: string;
  status: "Pending" | "Graded";
  marks: number | null;
  feedback: string;
  createdAt: string;
  updatedAt: string;
}

export const submitPaper = async (formData: FormData): Promise<PaperSubmission> => {
  const response = await api.post("/paper-submissions", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data.data;
};

export const getStudentSubmissions = async (): Promise<PaperSubmission[]> => {
  const response = await api.get("/paper-submissions/student");
  return response.data.data;
};

export const getAllSubmissions = async (status?: string): Promise<PaperSubmission[]> => {
  const url = status ? `/paper-submissions?status=${status}` : "/paper-submissions";
  const response = await api.get(url);
  return response.data.data;
};

export const gradeSubmission = async (
  id: string,
  marks: number,
  feedback: string
): Promise<PaperSubmission> => {
  const response = await api.put(`/paper-submissions/${id}/grade`, {
    marks,
    feedback,
  });
  return response.data.data;
};
