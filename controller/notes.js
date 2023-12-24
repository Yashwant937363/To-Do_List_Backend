const Note = require('../models/Note');
const { validationResult } = require('express-validator');

const getAllNotes = async (req, res) => {
    try {
        const notes = await Note.find({ user: req.user.id });
        res.json(notes);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
}

const handleAddNote = async (req, res) => {
    try {
        const { title, body, tag } = req.body;
        // If there are errors, return Bad request and the errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const note = new Note({
            title, body, tag, user: req.user.id
        })
        const savedNote = await note.save();
        res.send({ note: savedNote, msg: 'Note has been successfully created' });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("this nternal Server Error");
    }
}

const handleUpdateNote = async (req, res) => {
    const { title, body, tag } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // Create a newNote object
    const newNote = {};
    if (title) { newNote.title = title };
    if (body) { newNote.body = body };
    if (tag) { newNote.tag = tag };
    // Find the note to be updated and update it
    let note = await Note.findById(req.params.id);
    if (!note) { return res.status(404).send("Not Found") }

    if (note.user.toString() !== req.user.id) {
        return res.status(401).send("Not Allowed");
    }

    note = await Note.findByIdAndUpdate(req.params.id, { $set: newNote }, { new: true })
    res.json({ note });
}

const handleDeleteNote = async (req, res) => {
    let note = await Note.findById(req.params.id);
    if (!note) { return res.status(404).send("Not Found") }

    if (note.user.toString() !== req.user.id) {
        return res.status(401).send("Not Allowed");
    }

    note = await Note.findByIdAndDelete(req.params.id);
    const msg = "Note has been successfully deleted";
    res.json({ note, msg });

}

module.exports = { getAllNotes, handleAddNote, handleUpdateNote, handleDeleteNote };