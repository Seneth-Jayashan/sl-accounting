import Batch from "../models/Batch.js";
import Class from "../models/Class.js"; // Importing Class model if you need to verify existence

// ---------------------------------------------------------
// 1. CREATE BATCH
// ---------------------------------------------------------
export const createBatch = async (req, res) => {
  try {
    const { name, description, startDate, endDate, classes, isActive } = req.body;

    // 1. Basic Validation
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: "End date must be after start date." });
    }

    // 2. Check for duplicate name
    const existingBatch = await Batch.findOne({ name });
    if (existingBatch) {
      return res.status(400).json({ message: "A batch with this name already exists." });
    }

    // 3. Create
    const newBatch = new Batch({
      name,
      description,
      startDate,
      endDate,
      classes: classes || [], // Array of Class IDs
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
// 2. GET ALL BATCHES
// ---------------------------------------------------------
export const getAllBatches = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    
    // Filter logic: if ?activeOnly=true is passed, show only active batches
    const query = activeOnly === 'true' ? { isActive: true } : {};

    const batches = await Batch.find(query)
      .populate("classes", "name subject level") // Only fetch specific fields from Class
      .sort({ createdAt: -1 }); // Newest first

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

export const getAllPublicBatches = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    
    const query = activeOnly === 'true' ? { isActive: true } : {};

    const batches = await Batch.find(query)
      .populate("classes", "name subject level") // Only fetch specific fields from Class
      .sort({ createdAt: -1 }); // Newest first

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
// 3. GET BATCH BY ID
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
    console.error("getBatchById error:", error);
    return res.status(500).json({ message: "Error fetching batch", error: error.message });
  }
};

// ---------------------------------------------------------
// 4. UPDATE BATCH
// ---------------------------------------------------------
export const updateBatch = async (req, res) => {
  try {
    const { name, description, startDate, endDate, classes, isActive } = req.body;

    // Validate dates if both are provided
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
        return res.status(400).json({ message: "End date must be after start date." });
    }

    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    // Check Name Uniqueness (if name is changing)
    if (name && name !== batch.name) {
       const duplicate = await Batch.findOne({ name });
       if (duplicate) return res.status(400).json({ message: "Batch name already taken" });
    }

    // Update fields
    if (name) batch.name = name;
    if (description) batch.description = description;
    if (startDate) batch.startDate = startDate;
    if (endDate) batch.endDate = endDate;
    if (classes) batch.classes = classes; // Replaces existing array
    if (isActive !== undefined) batch.isActive = isActive;

    const updatedBatch = await batch.save();
    
    // Populate after save to return full details
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
// 5. DELETE BATCH
// ---------------------------------------------------------
export const deleteBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    // Optional: Logic to prevent deleting if students or classes are active?
    // For now, we just delete the batch document.
    await Batch.findByIdAndDelete(req.params.id);

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
// 6. TOGGLE STATUS (Helper)
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
        return res.status(500).json(error);
    }
}