const express = require('express');
const connectToDatabase = require('./database');
const cors = require('cors');
connectToDatabase();

const app = express();
const port = process.env.PORT || 5000;
app.get("/", (req, res) => {
    res.status(200).send('Hello World');
});

app.use(cors({
    origin: 'https://todo-list-by-yashwant.netlify.app',
    credentials: true, 
}));

app.use(express.json());
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));

app.listen(port, () => {
    console.log("server running at ", port);
});