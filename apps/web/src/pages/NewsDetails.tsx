import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import NewsService, { type NewsItem } from '../services/NewsService';

export default function NewsDetails() {
    const { id } = useParams<{ id: string }>();
    const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (id) {
            fetchNewsItem(id);
        }
    }, [id]);

    const fetchNewsItem = async (newsId: string) => {
        try {
            setLoading(true);
            const data = await NewsService.getNewsById(newsId);
            setNewsItem(data);
        } catch (error) {
            console.error("Failed to fetch news item", error);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 border-4 border-brand-cerulean border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !newsItem) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 pt-32 px-4 relative z-10">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">News not found</h2>
                <p className="text-gray-500 mb-6">The news article you are looking for does not exist or has been removed.</p>
                <Link to="/news" className="relative z-20 text-brand-cerulean font-semibold hover:underline flex items-center gap-2">
                    <ArrowLeft size={16} /> Back to News
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-16 px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto">
                <Link to="/news" className="relative z-20 inline-flex items-center gap-2 text-gray-500 hover:text-brand-cerulean transition-colors mb-8 font-medium">
                    <ArrowLeft size={20} /> Back to News
                </Link>

                <article className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    {newsItem.coverImage && (
                        <div className="w-full h-64 sm:h-96 overflow-hidden">
                            <img
                                src={`http://localhost:3000${newsItem.coverImage}`}
                                alt={newsItem.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                    <div className="p-8 sm:p-12">
                        <div className="flex flex-wrap items-center gap-4 mb-6">
                            <span className="px-4 py-1.5 bg-brand-cerulean/10 text-brand-cerulean text-sm font-bold uppercase tracking-wider rounded-full">
                                {newsItem.category}
                            </span>
                            <span className="text-sm text-gray-500 font-medium">
                                {new Date(newsItem.createdAt).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>
                        
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-prussian mb-8 leading-tight">
                            {newsItem.title}
                        </h1>

                        <div
                            className="prose prose-lg prose-blue max-w-none text-gray-600"
                            dangerouslySetInnerHTML={{ __html: newsItem.content }}
                        />
                    </div>
                </article>
            </div>
        </div>
    );
}
