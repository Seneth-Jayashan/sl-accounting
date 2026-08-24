import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import NewsService, { type NewsItem } from '../services/NewsService';

export default function News() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPublishedNews();
    }, []);

    const fetchPublishedNews = async () => {
        try {
            setLoading(true);
            const data = await NewsService.getAllNews(true); // only published
            setNews(data);
        } catch (error) {
            console.error("Failed to fetch news", error);
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

    return (
        <div className="min-h-screen bg-brand-aliceBlue/30 font-sans text-gray-900 pb-20">
            {/* HERO */}
            <div className="relative bg-brand-prussian text-white overflow-hidden rounded-b-[3rem] shadow-2xl z-10 pt-32 pb-20">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="absolute top-[-50%] left-[-10%] w-[600px] h-[600px] bg-brand-cerulean rounded-full blur-[120px] opacity-30 pointer-events-none"></div>
                <div className="absolute bottom-[-50%] right-[-10%] w-[600px] h-[600px] bg-brand-coral rounded-full blur-[120px] opacity-20 pointer-events-none"></div>

                <div className="relative max-w-7xl mx-auto px-6 text-center">
                    <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-6xl font-black mb-6 tracking-tight font-sinhala leading-tight">
                        Latest <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-jasmine to-brand-coral">News & Updates</span>
                    </motion.h1>
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-lg md:text-xl text-brand-aliceBlue/80 max-w-2xl mx-auto leading-relaxed font-sans">
                        Stay informed with the newest announcements, updates, and articles from SL Accounting.
                    </motion.p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">

                {news.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-gray-500">No news or updates available at the moment.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {news.map((item) => (
                            <article key={item._id || item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
                                {item.coverImage && (
                                    <div className="w-full h-48 overflow-hidden flex-shrink-0">
                                        <img
                                            src={`http://localhost:3000${item.coverImage}`} // Adjust base URL as needed for production
                                            alt={item.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="p-5 flex flex-col flex-grow">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="px-3 py-1 bg-brand-cerulean/10 text-brand-cerulean text-xs font-bold uppercase tracking-wider rounded-full">
                                            {item.category}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(item.createdAt).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    <h2 className="text-lg font-bold text-brand-prussian mb-3 line-clamp-2">
                                        {item.title}
                                    </h2>

                                    {/* Render HTML content safely */}
                                    <div
                                        className="prose prose-sm prose-blue max-w-none text-gray-600 line-clamp-3 mb-4"
                                        dangerouslySetInnerHTML={{ __html: item.content }}
                                    />
                                    <div className="mt-auto pt-4 border-t border-gray-100">
                                        <Link to={`/news/${item._id || item.id}`} className="text-brand-cerulean text-sm font-semibold hover:underline">
                                            Read More &rarr;
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
