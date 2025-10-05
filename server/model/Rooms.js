const mongoose = require('mongoose');

// File content history schema for tracking changes
const fileHistorySchema = new mongoose.Schema({
    filename: { type: String, required: true },
    content: { type: String, default: '' },
    language: { type: String, default: 'javascript' },
    lastModified: { type: Date, default: Date.now },
    lastModifiedBy: { type: String, default: 'unknown' },
    version: { type: Number, default: 1 }
});

// Main room schema with enhanced file tracking
const roomSchema = new mongoose.Schema({
    rid: { type: String, required: true, unique: true },
    
    // Current file states (latest version of each file)
    files: [fileHistorySchema],
    
    // Legacy fields (keeping for compatibility)
    updatedFiles: [{
        filename: { type: String },
        code: { type: String },
    }],
    
    // Room metadata
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    
    // Activity tracking
    lastActivity: { type: Date, default: Date.now },
    activeUsers: [{ type: String }], // Array of user IDs currently in room
    
    // Room settings
    maxUsers: { type: Number, default: 3 },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

// Index for faster queries
roomSchema.index({ rid: 1 });
roomSchema.index({ lastActivity: -1 });

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;