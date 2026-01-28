const mongoose = require('mongoose');

const documentCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String
    },
    submissions: [{
        collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
        username: String,
        title: String,
        description: String,
        fileName: String,
        fileUrl: String,
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('DocumentCategory', documentCategorySchema);
