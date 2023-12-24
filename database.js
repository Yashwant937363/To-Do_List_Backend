const mongoose = require('mongoose');
const uri = "mongodb://localhost:27017/todoUser?readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false";

const connectToDatabase = () => {
    mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    const db = mongoose.connection;

    db.on('error', (err) => {
        console.error("Connection to the database failed:", err);
    });

    db.once('open', () => {
        console.log("Connected to the database successfully");
    });
}

module.exports = connectToDatabase;
