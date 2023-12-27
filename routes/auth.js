const express = require('express');
const route = express.Router();
const { body } = require('express-validator');
const fetchuser = require('../middleware/fetchuser');
const { handleCreateNewUser, handleLoginUser, getUserDetails } = require('../controller/user');

//Route 1: POST request to create new user "/api/users/" 
route.post('/', [
    body('username', "username at least have minimum 3 characters").exists(),
    body('email', "Enter Valid Email").isEmail(),
    body('password', "Password Have at least 8 Characters").isLength({ min: 8 }),
], handleCreateNewUser);

//Route 2: POST request to login user "/api/users/login" 
route.post('/login', [
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password cannot be blank').exists(),
], handleLoginUser);

// ROUTE 3: Get loggedin User Details using: GET "/api/auth/". Login required
route.get('/', fetchuser, getUserDetails);

module.exports = route;