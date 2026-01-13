const mongoose = require('mongoose');

const careerSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, required: true, enum: ['Full-time', 'Part-time', 'Contract', 'Freelance'] },
    location: { type: String, required: true },
    description: { type: String, required: true },
    requirements: { type: [String], default: [] },
    contactEmail: { type: String, required: true },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('Career', careerSchema);
