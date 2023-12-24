const mongoose = require('mongoose');
require('dotenv').config();
const url = process.env.DATABASE_URL;

const connectToDatabase = () => {
    mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });

    const db = mongoose.connection;

    db.on('error', (err) => {
        console.error("Connection to the database failed:", err);
    });

    db.once('open', () => {
        console.log("Connected to the database successfully");
    });
}

module.exports = connectToDatabase;
