const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    rid : {type: String, required: true, unique: true},
    files : [{
        filename: {type: String, required: true},
        code : {type: String, required: true},
    }],
    updatedFiles : [{
        filename: {type: String},
        code : {type: String},
    }],
    owner : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;