import mongoose from "mongoose";

const materialCategorySchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, "Please provide a category name"], 
        trim: true,
        unique: true
    }
}, {
    timestamps: true
});

export default mongoose.model("MaterialCategory", materialCategorySchema);
