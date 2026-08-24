import api from './api'; // assuming api instance exists

export interface SettingData {
    examDate: string | null;
    heroImageUrl: string | null;
    newsTitle: string;
    newsLink: string;
}

const SettingService = {
    getSettings: async (): Promise<{ success: boolean; data: SettingData }> => {
        const response = await api.get('/settings');
        return response.data;
    },

    updateSettings: async (formData: FormData): Promise<{ success: boolean; message: string; data: SettingData }> => {
        const response = await api.put('/settings', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
};

export default SettingService;
