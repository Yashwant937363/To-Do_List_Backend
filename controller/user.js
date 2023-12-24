User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
const { validationResult } = require('express-validator');
const { response } = require('express');
const JWT_SECRET = "chieftain";

const handleCreateNewUser = async (req, res) => {
    // Validation errors check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Check for existing user with the provided email or username
        const existingUser = await User.findOne({ email: req.body.email });

        if (existingUser) {
            return res.status(400).send("Please enter a unique email address.");
        }
        const salt = await bcrypt.genSalt();
        const password = await bcrypt.hash(req.body.password, salt);

        // Create a new user
        const newUser = await User.create({
            username: req.body.username,
            email: req.body.email,
            password: password
        });

        data = {
            user: {
                id: newUser.id
            }
        }
        let authtoken = jwt.sign(data, JWT_SECRET);
        res.json({ authtoken });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
}

const handleLoginUser = async (req, res) => {

    // If there are errors, return Bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: "Please try to login with correct credentials" });
        }

        const passwordCompare = await bcrypt.compare(password, user.password);
        if (!passwordCompare) {
            return res.status(401).json({ error: "Please try to login with correct credentials" });
        }

        const data = {
            user: {
                id: user.id
            }
        }
        const authtoken = jwt.sign(data, JWT_SECRET);
        res.json({
            'authtoken' : authtoken,
            'username' : user.username,
            'msg' : 'Login Successful',
        })
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
}

const getUserDetails = async (req, res) => {
    try {
        userId = req.user.id;
        const user = await User.findById(userId).select("-password")
        res.send(user)
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
}

module.exports = { handleCreateNewUser, handleLoginUser, getUserDetails };