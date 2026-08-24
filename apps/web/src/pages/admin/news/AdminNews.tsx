import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import NewsService, { type NewsItem } from '../../../services/NewsService';

export default function AdminNews() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNews, setEditingNews] = useState<NewsItem | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<'News' | 'Update'>('News');
    const [isPublished, setIsPublished] = useState(true);
    const [coverImage, setCoverImage] = useState<File | null>(null);

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        try {
            setLoading(true);
            const data = await NewsService.getAllNews();
            setNews(data);
        } catch (error) {
            console.error("Failed to fetch news", error);
            alert("Failed to load news");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (item?: NewsItem) => {
        if (item) {
            setEditingNews(item);
            setTitle(item.title);
            setContent(item.content);
            setCategory(item.category);
            setIsPublished(item.isPublished);
            setCoverImage(null);
        } else {
            setEditingNews(null);
            setTitle('');
            setContent('');
            setCategory('News');
            setIsPublished(true);
            setCoverImage(null);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingNews(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            formData.append('category', category);
            formData.append('isPublished', String(isPublished));
            if (coverImage) {
                formData.append('coverImage', coverImage);
            }

            if (editingNews) {
                await NewsService.updateNews(editingNews._id || editingNews.id, formData);
            } else {
                await NewsService.createNews(formData);
            }
            
            handleCloseModal();
            fetchNews();
        } catch (error) {
            console.error("Failed to save news", error);
            alert("Failed to save news");
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this news item?")) {
            try {
                await NewsService.deleteNews(id);
                fetchNews();
            } catch (error) {
                console.error("Failed to delete news", error);
                alert("Failed to delete news");
            }
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">News & Updates</h1>
                    <p className="text-sm text-gray-500">Manage business and accounting news</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-brand-cerulean text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-cerulean/90"
                >
                    <PlusIcon className="w-5 h-5" />
                    Create News
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Title</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Category</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {news.map((item) => (
                                <tr key={item._id || item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-900">{item.title}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{item.category}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {item.isPublished ? 'Published' : 'Draft'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-3">
                                        <button
                                            onClick={() => handleOpenModal(item)}
                                            className="text-brand-cerulean hover:text-blue-700 transition"
                                            title="Edit"
                                        >
                                            <PencilSquareIcon className="w-5 h-5 inline-block" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item._id || item.id)}
                                            className="text-red-500 hover:text-red-700 transition"
                                            title="Delete"
                                        >
                                            <TrashIcon className="w-5 h-5 inline-block" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {news.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No news or updates found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingNews ? 'Edit News' : 'Create News'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-cerulean/20 outline-none"
                                        placeholder="Enter title"
                                    />
                                </div>
                                
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">Category</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value as 'News' | 'Update')}
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-cerulean/20 outline-none"
                                    >
                                        <option value="News">News</option>
                                        <option value="Update">Update</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-700">Cover Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-cerulean/20 outline-none"
                                />
                                {editingNews?.coverImage && !coverImage && (
                                    <p className="text-xs text-gray-500 mt-1">Current image: {editingNews.coverImage}</p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-700">Content</label>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <ReactQuill 
                                        theme="snow" 
                                        value={content} 
                                        onChange={setContent}
                                        className="bg-white min-h-[200px]"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isPublished"
                                    checked={isPublished}
                                    onChange={(e) => setIsPublished(e.target.checked)}
                                    className="w-4 h-4 text-brand-cerulean rounded focus:ring-brand-cerulean"
                                />
                                <label htmlFor="isPublished" className="text-sm font-semibold text-gray-700">
                                    Publish immediately
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-6 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 text-sm font-semibold text-white bg-brand-cerulean hover:bg-brand-cerulean/90 rounded-lg"
                                >
                                    {editingNews ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
