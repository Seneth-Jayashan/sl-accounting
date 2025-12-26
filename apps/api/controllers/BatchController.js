import Batch from "../models/Batch.js";
import Class from "../models/Class.js"; 

// ---------------------------------------------------------
// 1. CREATE BATCH
// ---------------------------------------------------------
export const createBatch = async (req, res) => {
  try {
    const { name, description, startDate, endDate, classes, isActive } = req.body;

    // 1. Validation & Sanitization
    if (!name) return res.status(400).json({ message: "Batch name is required" });
    
    // Security: Convert name to string to prevent NoSQL Injection
    const safeName = String(name).trim();

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: "End date must be after start date." });
    }

    // 2. Check for duplicate name
    const existingBatch = await Batch.findOne({ name: safeName });
    if (existingBatch) {
      return res.status(409).json({ message: "A batch with this name already exists." });
    }

    // 3. Create
    const newBatch = new Batch({
      name: safeName,
      description,
      startDate,
      endDate,
      classes: classes || [], 
      isActive: isActive !== undefined ? isActive : true,
    });

    const savedBatch = await newBatch.save();

    return res.status(201).json({
      success: true,
      message: "Batch created successfully",
      batch: savedBatch,
    });

  } catch (error) {
    console.error("createBatch error:", error);
    return res.status(500).json({ message: "Error creating batch", error: error.message });
  }
};

// ---------------------------------------------------------
// 2. GET ALL BATCHES (Admin/Internal)
// ---------------------------------------------------------
export const getAllBatches = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    
    const query = activeOnly === 'true' ? { isActive: true } : {};

    const batches = await Batch.find(query)
      .populate("classes", "name subject level") 
      .sort({ createdAt: -1 }); 

    return res.status(200).json({
      success: true,
      count: batches.length,
      batches,
    });

  } catch (error) {
    console.error("getAllBatches error:", error);
    return res.status(500).json({ message: "Error fetching batches", error: error.message });
  }
};

// ---------------------------------------------------------
// 3. GET PUBLIC BATCHES (For Dropdowns)
// ---------------------------------------------------------
export const getAllPublicBatches = async (req, res) => {
  try {
    // Only fetch active batches for the public interface
    const query = { isActive: true };

    // Security: Select only necessary fields. Do not leak internal data.
    const batches = await Batch.find(query)
      .select("_id name startDate endDate") 
      .sort({ startDate: -1 }); // Sort by start date usually makes more sense for users

    return res.status(200).json({
      success: true,
      count: batches.length,
      batches,
    });

  } catch (error) {
    console.error("getAllPublicBatches error:", error);
    return res.status(500).json({ message: "Error fetching public batches" });
  }
};

// ---------------------------------------------------------
// 4. GET BATCH BY ID
// ---------------------------------------------------------
export const getBatchById = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id).populate("classes");

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    return res.status(200).json({
      success: true,
      batch,
    });

  } catch (error) {
    return res.status(500).json({ message: "Error fetching batch", error: error.message });
  }
};

// ---------------------------------------------------------
// 5. UPDATE BATCH
// ---------------------------------------------------------
export const updateBatch = async (req, res) => {
  try {
    const { name, description, startDate, endDate, classes, isActive } = req.body;

    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    // Validate Dates
    const sDate = startDate ? new Date(startDate) : new Date(batch.startDate);
    const eDate = endDate ? new Date(endDate) : new Date(batch.endDate);

    if (sDate >= eDate) {
        return res.status(400).json({ message: "End date must be after start date." });
    }

    // Check Name Uniqueness
    if (name && name !== batch.name) {
       const safeName = String(name).trim();
       const duplicate = await Batch.findOne({ name: safeName });
       if (duplicate) return res.status(409).json({ message: "Batch name already taken" });
       batch.name = safeName;
    }

    // Update fields
    if (description !== undefined) batch.description = description;
    if (startDate) batch.startDate = startDate;
    if (endDate) batch.endDate = endDate;
    if (classes) batch.classes = classes; 
    if (isActive !== undefined) batch.isActive = isActive;

    const updatedBatch = await batch.save();
    
    // Re-populate for frontend consistency
    await updatedBatch.populate("classes", "name");

    return res.status(200).json({
      success: true,
      message: "Batch updated successfully",
      batch: updatedBatch,
    });

  } catch (error) {
    console.error("updateBatch error:", error);
    return res.status(500).json({ message: "Error updating batch", error: error.message });
  }
};

// ---------------------------------------------------------
// 6. DELETE BATCH
// ---------------------------------------------------------
export const deleteBatch = async (req, res) => {
  try {
    const batchId = req.params.id;

    // 1. Referential Integrity Check
    // Prevent deletion if classes are linked to this batch
    const linkedClasses = await Class.countDocuments({ batch: batchId });
    if (linkedClasses > 0) {
        return res.status(400).json({ 
            success: false, 
            message: `Cannot delete batch. It is linked to ${linkedClasses} active classes. Please delete or reassign them first.` 
        });
    }

    // 2. Perform Deletion
    const deletedBatch = await Batch.findByIdAndDelete(batchId);
    
    if (!deletedBatch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Batch deleted successfully",
    });

  } catch (error) {
    console.error("deleteBatch error:", error);
    return res.status(500).json({ message: "Error deleting batch", error: error.message });
  }
};

// ---------------------------------------------------------
// 7. TOGGLE STATUS
// ---------------------------------------------------------
export const toggleBatchStatus = async (req, res) => {
    try {
        const batch = await Batch.findById(req.params.id);
        if (!batch) return res.status(404).json({ message: "Batch not found" });

        batch.isActive = !batch.isActive;
        await batch.save();

        return res.status(200).json({ 
            success: true, 
            message: `Batch is now ${batch.isActive ? 'Active' : 'Inactive'}`, 
            isActive: batch.isActive 
        });
    } catch (error) {
        return res.status(500).json({ message: "Error toggling status" });
    }
}