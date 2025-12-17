(function (){})();
import fs from 'fs';
import path from 'path';
import KnowledgeBase from '../models/KnowledgeBase.js';


export const createKnowledge = async (req, res) => {
	try {
		const { title, description, class: classId, catageory, isPublished, publishAt } = req.body;

		if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

		const kb = new KnowledgeBase({
			title,
			description,
			catageory: catageory || undefined,
			class: classId || undefined,
			uploadedBy: req.user?._id,
			isPublished: isPublished === 'true' || isPublished === true,
		});

		// handle scheduled publish
		if (publishAt) {
			const dt = new Date(publishAt);
			if (!isNaN(dt.getTime())) {
				kb.publishAt = dt;
				if (dt > new Date()) kb.isPublished = false;
				else kb.isPublished = true;
			}
		}

		if (req.file) {
			kb.filePath = req.file.path;
			kb.fileName = req.file.originalname;
			kb.fileMime = req.file.mimetype;
		}

		await kb.save();
		return res.status(201).json({ success: true, knowledge: kb });
	} catch (error) {
		console.error('Create Knowledge Error:', error);
		return res.status(500).json({ success: false, message: 'Internal Server Error' });
	}
};

export const getAllKnowledge = async (req, res) => {
	try {
		// Auto-publish items whose publishAt has passed
		try {
			await KnowledgeBase.updateMany(
				{ isPublished: false, publishAt: { $lte: new Date() } },
				{ $set: { isPublished: true } }
			);
		} catch (e) {
			console.warn('Auto-publish check failed', e);
		}

		const query = {};

		// Non-admins see only published items
		if (!req.user || req.user.role !== 'admin') {
			query.isPublished = true;
		}

		if (req.query.class && req.query.class !== 'All') query.class = req.query.class;
		if (req.query.catageory) query.catageory = req.query.catageory;
		if (req.query.search) {
			const s = new RegExp(req.query.search, 'i');
			query.$or = [{ title: s }, { description: s }, { fileName: s }];
		}

		const items = await KnowledgeBase.find(query).sort({ createdAt: -1 }).populate('uploadedBy', '-password');
		return res.status(200).json({ success: true, items });
	} catch (error) {
		console.error('Get All Knowledge Error:', error);
		return res.status(500).json({ success: false, message: 'Internal Server Error' });
	}
};

export const getKnowledgeById = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await KnowledgeBase.findById(id).populate('uploadedBy', '-password');
		if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

		if (!item.isPublished && (!req.user || req.user.role !== 'admin')) {
			return res.status(403).json({ success: false, message: 'Forbidden' });
		}

		return res.status(200).json({ success: true, item });
	} catch (error) {
		console.error('Get Knowledge By Id Error:', error);
		return res.status(500).json({ success: false, message: 'Internal Server Error' });
	}
};

export const updateKnowledge = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await KnowledgeBase.findById(id);
		if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

	const { title, description, isPublished, class: classId, catageory, publishAt } = req.body;
		if (title) item.title = title;
		if (description) item.description = description;
		if (typeof isPublished !== 'undefined') item.isPublished = isPublished === 'true' || isPublished === true;
		if (classId) item.class = classId;
		if (catageory) item.catageory = catageory;

		if (req.file) {
			// delete old file if exists
			if (item.filePath && fs.existsSync(item.filePath)) {
				try { fs.unlinkSync(item.filePath); } catch (e) { console.warn('Could not remove old file', e); }
			}
			item.filePath = req.file.path;
			item.fileName = req.file.originalname;
			item.fileMime = req.file.mimetype;
		}

		// handle publishAt updates
		if (publishAt) {
			const dt = new Date(publishAt);
			if (!isNaN(dt.getTime())) {
				item.publishAt = dt;
				if (dt > new Date()) item.isPublished = false;
				else item.isPublished = true;
			}
		} else if (typeof publishAt !== 'undefined' && !publishAt) {
			item.publishAt = undefined;
		}

		await item.save();
		return res.status(200).json({ success: true, item });
	} catch (error) {
		console.error('Update Knowledge Error:', error);
		return res.status(500).json({ success: false, message: 'Internal Server Error' });
	}
};

export const deleteKnowledge = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await KnowledgeBase.findById(id);
		if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

		// remove file (resolve absolute path similar to download handler)
		if (item.filePath) {
			const fileAbsolute = path.isAbsolute(item.filePath) ? item.filePath : path.join(process.cwd(), item.filePath);
			if (fs.existsSync(fileAbsolute)) {
				try { fs.unlinkSync(fileAbsolute); } catch (e) { console.warn('Could not remove file', e); }
			}
		}

		// delete the document (use model method to avoid calling deprecated/absent instance.remove)
		await KnowledgeBase.findByIdAndDelete(id);
		return res.status(200).json({ success: true, message: 'Item deleted' });
	} catch (error) {
		console.error('Delete Knowledge Error:', error);
		return res.status(500).json({ success: false, message: 'Internal Server Error' });
	}
};

export const downloadKnowledge = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await KnowledgeBase.findById(id);
		if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

		if (!item.isPublished && (!req.user || req.user.role !== 'admin')) {
			return res.status(403).json({ success: false, message: 'Forbidden' });
		}

		if (!item.filePath) return res.status(404).json({ success: false, message: 'File not available' });

		const fileAbsolute = path.isAbsolute(item.filePath) ? item.filePath : path.join(process.cwd(), item.filePath);
		if (!fs.existsSync(fileAbsolute)) return res.status(404).json({ success: false, message: 'File not found on server' });

		return res.download(fileAbsolute, item.fileName || path.basename(fileAbsolute));
	} catch (error) {
		console.error('Download Knowledge Error:', error);
		return res.status(500).json({ success: false, message: 'Internal Server Error' });
	}
};

