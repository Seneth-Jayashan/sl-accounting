import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
    {
        examDate: {
            type: Date,
            default: null,
        },
        heroImageUrl: {
            type: String,
            default: null,
        },
        newsTitle: {
            type: String,
            default: '',
        },
        newsLink: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

const Setting = mongoose.model('Setting', settingSchema);
export default Setting;
