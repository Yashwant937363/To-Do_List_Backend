const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const userModel = new Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    }

}, { timestamps: true })

const User = mongoose.model('user', userModel);
module.exports = User;