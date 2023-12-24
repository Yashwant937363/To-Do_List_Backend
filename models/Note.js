const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notesModel = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    title: {
        type: String,
        required: true,
    },
    body: {
        type: String,
        required: true,
    },
    tag: {
        type: String,
        default: "General",
    },
}, { timestamps: true },)
const Notes = mongoose.model('notes', notesModel);
module.exports = Notes;