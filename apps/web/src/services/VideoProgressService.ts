import { api } from "./api";

const BASE_URL = "/video-progress";

export interface VideoProgressData {
  [videoId: string]: {
    status: 'started' | 'completed';
  };
}

const VideoProgressService = {
  getMyProgress: async () => {
    const response = await api.get<{ success: boolean; data: VideoProgressData }>(BASE_URL);
    return response.data.data;
  },

  updateProgress: async (videoId: string, status: 'started' | 'completed') => {
    const response = await api.post<{ success: boolean; data: any }>(BASE_URL, {
      videoId,
      status
    });
    return response.data.data;
  },

  getRecordingProgress: async () => {
    const response = await api.get<{ success: boolean; data: VideoProgressData }>(`${BASE_URL}?type=recording`);
    return response.data.data;
  },

  updateRecordingProgress: async (sessionId: string, status: 'started' | 'completed') => {
    const response = await api.post<{ success: boolean; data: any }>(BASE_URL, {
      sessionId,
      status
    });
    return response.data.data;
  }
};

export default VideoProgressService;
