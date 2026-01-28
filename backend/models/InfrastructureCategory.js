const mongoose = require('mongoose');

const InfrastructureCategorySchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // College username - unique per user
  categories: [
    {
      name: { type: String, required: true },
      files: [
        {
          fileName: String,
          fileUrl: String,
          label: String,
          description: String,
          dimension: String,
          uploadedAt: { type: Date, default: Date.now }
        }
      ]
    }
  ]
});

// Ensure only the username field has a unique index
InfrastructureCategorySchema.index({ username: 1 }, { unique: true });

module.exports = mongoose.model('InfrastructureCategory', InfrastructureCategorySchema); 