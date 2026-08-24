import api from './api';

export interface NewsItem {
    id: string;
    _id: string;
    title: string;
    content: string;
    category: 'News' | 'Update';
    coverImage?: string;
    isPublished: boolean;
    createdAt: string;
    updatedAt: string;
}

class NewsService {
    async getAllNews(isPublished?: boolean): Promise<NewsItem[]> {
        const url = isPublished !== undefined ? `/news?isPublished=${isPublished}` : '/news';
        const response = await api.get(url);
        return response.data;
    }

    async getNewsById(id: string): Promise<NewsItem> {
        const response = await api.get(`/news/${id}`);
        return response.data;
    }

    async createNews(formData: FormData): Promise<NewsItem> {
        const response = await api.post('/news', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.news;
    }

    async updateNews(id: string, formData: FormData): Promise<NewsItem> {
        const response = await api.put(`/news/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.news;
    }

    async deleteNews(id: string): Promise<void> {
        await api.delete(`/news/${id}`);
    }
}

export default new NewsService();
