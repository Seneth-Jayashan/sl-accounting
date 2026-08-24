import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Image as ImageIcon, Calendar, Link2, Type, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import SettingService, { type SettingData } from '../../../services/SettingService';

export default function AdminSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<SettingData>({
        examDate: null,
        heroImageUrl: null,
        newsTitle: '',
        newsLink: ''
    });
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await SettingService.getSettings();
            if (res.success && res.data) {
                // Ensure date is formatted correctly for date input if it exists
                let formattedDate = null;
                if (res.data.examDate) {
                    const dateObj = new Date(res.data.examDate);
                    formattedDate = dateObj.toISOString().split('T')[0];
                }
                
                setSettings({
                    ...res.data,
                    examDate: formattedDate
                });
                
                if (res.data.heroImageUrl) {
                    setImagePreview(res.data.heroImageUrl); // Will be parsed correctly if it's a full URL or absolute path
                }
            }
        } catch (error) {
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            
            if (settings.examDate) {
                formData.append('examDate', settings.examDate);
            }
            formData.append('newsTitle', settings.newsTitle || '');
            formData.append('newsLink', settings.newsLink || '');
            
            if (selectedImage) {
                formData.append('heroImage', selectedImage);
            }

            const res = await SettingService.updateSettings(formData);
            if (res.success) {
                toast.success('Settings updated successfully');
                // Refresh to get the actual image URL
                fetchSettings();
                setSelectedImage(null);
            } else {
                toast.error(res.message || 'Failed to update settings');
            }
        } catch (error) {
            toast.error("An error occurred while saving settings");
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-brand-cerulean w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto pb-24">
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-black text-brand-prussian tracking-tight">System Settings</h1>
                <p className="text-sm text-gray-500 mt-1">Configure global application settings and home page details.</p>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100 space-y-8"
            >
                
                {/* 1. Exam Date Timer */}
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Calendar className="text-brand-cerulean" /> Exam Countdown Timer
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Target Date of Exam</label>
                        <p className="text-xs text-gray-500 mb-3">This will display a countdown timer (e.g. දින 20 පැය 6 යි...) on all student windows.</p>
                        <input 
                            type="date" 
                            className="w-full sm:w-1/2 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean transition-colors"
                            value={settings.examDate || ''}
                            onChange={(e) => setSettings({...settings, examDate: e.target.value})}
                        />
                    </div>
                </div>

                <hr className="border-gray-100" />

                {/* 2. Home Page Hero Photo */}
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <ImageIcon className="text-brand-coral" /> Home Page Hero Image
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-xs text-gray-500 mb-4">Upload a new photo to replace the main hero section image on the landing page.</p>
                        
                        {imagePreview && (
                            <div className="mb-4">
                                <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Current / Preview</p>
                                <img src={imagePreview} alt="Hero Preview" className="max-w-full h-48 object-cover rounded-xl border border-gray-200 shadow-sm" />
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <label className="cursor-pointer bg-white px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                                Choose Image
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageChange}
                                />
                            </label>
                            {selectedImage && <span className="text-sm text-green-600 font-medium truncate max-w-[200px]">{selectedImage.name} selected</span>}
                        </div>
                    </div>
                </div>

                <hr className="border-gray-100" />

                {/* 3. News and Updates */}
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Type className="text-brand-jasmine" /> Business & Accounting News
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
                        <p className="text-xs text-gray-500 mb-2">Display a news link on the home page for latest updates.</p>
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">News Title / Text</label>
                            <input 
                                type="text" 
                                placeholder="e.g. Read the latest accounting syllabus changes..."
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean transition-colors"
                                value={settings.newsTitle}
                                onChange={(e) => setSettings({...settings, newsTitle: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1.5"><Link2 size={16}/> News Link (URL)</label>
                            <input 
                                type="url" 
                                placeholder="https://example.com/news"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean transition-colors"
                                value={settings.newsLink}
                                onChange={(e) => setSettings({...settings, newsLink: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                {/* Save Action */}
                <div className="pt-4 flex justify-end">
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-brand-prussian text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-prussian/90 transition-colors shadow-lg shadow-brand-prussian/20 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
