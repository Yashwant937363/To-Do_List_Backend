const express = require('express');
const router = express.Router();
const { getAllNotes, handleAddNote, handleUpdateNote, handleDeleteNote } = require('../controller/notes')
const fetchuser = require('../middleware/fetchuser');
const { body } = require('express-validator');

// ROUTE 1: Get All the Notes using: GET "/api/notes/". Login required
router.route('/')
.get(fetchuser, getAllNotes)
// ROUTE 2: Add a new Note using: POST "/api/notes/". Login required
.post(
    fetchuser,
    [
        body('title', 'Title Cannot be Null').exists(),
        body('body', 'Description must be atleast 5 characters').isLength({ min: 5 }),
    ],
    handleAddNote
    );
    
    router.route('/:id')
    .put(fetchuser,[
        body('title', 'Title Cannot be Null').exists(),
        body('body', 'Description must be atleast 5 characters').isLength({ min: 5 }),    
    ], handleUpdateNote)
    .delete(fetchuser, handleDeleteNote);

module.exports = router;