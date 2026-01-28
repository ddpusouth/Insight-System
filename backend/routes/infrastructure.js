const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const InfrastructureCategory = require('../models/InfrastructureCategory');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/infrastructure/'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// POST /api/infrastructure/category - add new category (per college)
router.post('/category', async (req, res) => {
  try {
    const { name, username } = req.body;
    console.log('Creating category:', { name, username });

    if (!name || !username) return res.status(400).json({ error: 'Category name and username are required' });

    // Find or create user document
    let userDoc = await InfrastructureCategory.findOne({ username });
    console.log('Existing user doc:', userDoc ? 'found' : 'not found');

    if (!userDoc) {
      userDoc = new InfrastructureCategory({ username, categories: [] });
      console.log('Created new user document for:', username);
    }

    // Check if category already exists for this user
    const existingCategory = userDoc.categories.find(cat => cat.name === name);
    console.log('Existing category check:', existingCategory ? 'found' : 'not found');

    if (existingCategory) {
      console.log('Category already exists for user:', username, 'category:', name);
      return res.status(400).json({ error: 'Category already exists for this college' });
    }

    // Add new category
    userDoc.categories.push({ name, files: [] });
    await userDoc.save();
    console.log('Successfully added category:', name, 'for user:', username);

    res.status(201).json(userDoc);
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/infrastructure/:category/upload - upload file(s) to category (per college)
router.post('/:category/upload', upload.array('file'), async (req, res) => {
  try {
    const { username, label, description, dimension } = req.body;
    const { category } = req.params;
    if (!username) return res.status(400).json({ error: 'Username is required' });

    // Find user document
    let userDoc = await InfrastructureCategory.findOne({ username });
    if (!userDoc) {
      userDoc = new InfrastructureCategory({ username, categories: [] });
    }

    // Find or create category
    let categoryDoc = userDoc.categories.find(cat => cat.name === category);
    if (!categoryDoc) {
      categoryDoc = { name: category, files: [] };
      userDoc.categories.push(categoryDoc);
    }

    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

    // Add files to category
    for (const file of req.files) {
      const fileUrl = `/uploads/infrastructure/${file.filename}`;
      categoryDoc.files.push({
        fileName: file.originalname,
        fileUrl,
        label: label || '',
        description: description || '',
        dimension: dimension || ''
      });
    }

    await userDoc.save();
    res.status(201).json(userDoc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/infrastructure/fix-index - drop the problematic index
router.post('/fix-index', async (req, res) => {
  try {
    console.log('Fixing index issue...');

    // Drop the problematic index on 'name' field
    const collection = InfrastructureCategory.collection;
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);

    // Find and drop the index on 'name' field
    for (const index of indexes) {
      if (index.key && index.key.name === 1) {
        console.log('Dropping index on name field:', index);
        await collection.dropIndex(index.name);
        console.log('Successfully dropped index on name field');
      }
    }

    res.json({ message: 'Index fixed successfully' });
  } catch (err) {
    console.error('Index fix error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/infrastructure/migrate - migrate old data structure to new
router.post('/migrate', async (req, res) => {
  try {
    console.log('Starting migration...');

    // Find all old documents (with 'name' field at root level)
    const oldDocs = await InfrastructureCategory.find({ name: { $exists: true } });
    console.log('Found old documents:', oldDocs.length);

    // Group by username
    const groupedByUsername = {};
    oldDocs.forEach(doc => {
      if (!groupedByUsername[doc.username]) {
        groupedByUsername[doc.username] = [];
      }
      groupedByUsername[doc.username].push({
        name: doc.name,
        files: doc.files || []
      });
    });

    // Create new documents for each username
    for (const [username, categories] of Object.entries(groupedByUsername)) {
      console.log('Migrating user:', username, 'with categories:', categories.length);

      // Check if new document already exists
      let newDoc = await InfrastructureCategory.findOne({ username });
      if (!newDoc) {
        newDoc = new InfrastructureCategory({ username, categories });
        await newDoc.save();
        console.log('Created new document for:', username);
      } else {
        // Merge categories
        categories.forEach(category => {
          const existing = newDoc.categories.find(cat => cat.name === category.name);
          if (!existing) {
            newDoc.categories.push(category);
          }
        });
        await newDoc.save();
        console.log('Updated existing document for:', username);
      }
    }

    // Delete old documents
    await InfrastructureCategory.deleteMany({ name: { $exists: true } });
    console.log('Deleted old documents');

    res.json({ message: 'Migration completed successfully' });
  } catch (err) {
    console.error('Migration error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/infrastructure/debug - debug route to check database state
router.get('/debug', async (req, res) => {
  try {
    const allDocs = await InfrastructureCategory.find({});
    console.log('All infrastructure documents:', allDocs);
    res.json({
      totalDocuments: allDocs.length,
      documents: allDocs.map(doc => ({
        username: doc.username,
        categoriesCount: doc.categories.length,
        categories: doc.categories.map(cat => cat.name)
      }))
    });
  } catch (err) {
    console.error('Debug error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/infrastructure?username=... - list all categories and files for a college
router.get('/', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'Username is required' });

    const userDoc = await InfrastructureCategory.findOne({ username });
    if (!userDoc) {
      return res.json([]);
    }

    // Transform the data to match the expected format
    const categories = userDoc.categories.map(cat => ({
      name: cat.name,
      files: cat.files
    }));

    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/infrastructure/category/:categoryName - delete a category and all its files
router.delete('/category/:categoryName', async (req, res) => {
  try {
    const { username } = req.query;
    const { categoryName } = req.params;

    if (!username) return res.status(400).json({ error: 'Username is required' });

    const userDoc = await InfrastructureCategory.findOne({ username });
    if (!userDoc) {
      return res.status(404).json({ error: 'User not found' });
    }

    const categoryIndex = userDoc.categories.findIndex(cat => cat.name === categoryName);
    if (categoryIndex === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Delete all files from the category from the file system
    const category = userDoc.categories[categoryIndex];
    for (const file of category.files) {
      if (file.fileUrl) {
        const filePath = path.join(__dirname, '..', file.fileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    // Remove the category from the database
    userDoc.categories.splice(categoryIndex, 1);
    await userDoc.save();

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/infrastructure/:categoryName/file/:fileName - delete a specific file
router.delete('/:categoryName/file/:fileName', async (req, res) => {
  try {
    const { username } = req.query;
    const { categoryName, fileName } = req.params;

    if (!username) return res.status(400).json({ error: 'Username is required' });

    const userDoc = await InfrastructureCategory.findOne({ username });
    if (!userDoc) {
      return res.status(404).json({ error: 'User not found' });
    }

    const category = userDoc.categories.find(cat => cat.name === categoryName);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const fileIndex = category.files.findIndex(file => file.fileName === fileName);
    if (fileIndex === -1) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete the file from the file system
    const file = category.files[fileIndex];
    if (file.fileUrl) {
      const filePath = path.join(__dirname, '..', file.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Remove the file from the database
    category.files.splice(fileIndex, 1);
    await userDoc.save();

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (err) {
    console.error('Error deleting file:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/infrastructure/all - get all infrastructure data for all colleges
router.get('/all', async (req, res) => {
  try {
    const allInfra = await InfrastructureCategory.find({});
    res.json(allInfra);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 