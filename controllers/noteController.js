const User = require('../models/User');
const Note = require('../models/Note');
const asyncHandler = require('express-async-handler');


// @desc Get all notes
// @route GET /notes
// @access Private
const getAllNotes = asyncHandler(async(req, res) => {
    const notes = await Note.find().lean();
    if(!notes?.length) {
        return res.status(400).json({message: "No notes found"})
    }
    
    const notesWithUser = await Promise.all(notes.map(async(note) => {
        const user = await User.findById(note.user).lean().exec()
        return {...note, username: user.username}
    }))

    res.json(notesWithUser)
});

// @desc Creat new note
// @route POST /notes
// @access Private
const createNewNote = asyncHandler(async(req, res) => {
    const {user, title, text} = req.body

    if(!user || !title || !text) {
        return res.status(400).json({message: 'All fields are required'})
    }

    const duplicate = await Note.findOne({title}).lean().exec()
    if(duplicate) {
        return res.status(409).json({message: 'Duplicate title'})
    }

    const noteObj = {user, title, text}
    const note = await Note.create(noteObj)

    if(note) {
        res.status(201).json({message: `New note ${title} created`})
    } else {
        res.status(400).json({message: 'Invalid note data received'})
    }
});

// @desc Edit note
// @route PUT /notes
// @access Private
const editNote = asyncHandler(async(req, res) => {
    const {id, title, text, user, completed} = req.body

    if(!id || !title || !text || !user || typeof completed !== 'boolean') {
        return res.status(400).json({message: 'All fields are required'})
    }

    const note = await Note.findById(id).exec()

    if(!note) {
        return res.status(400).json({message: 'Note not found'})
    }

    const duplicate = await Note.findOne({title}).lean().exec()

    if(duplicate && duplicate._id.toString() !== id) {
        return res.status(409).json({message: 'Duplicate title'})
    }

    note.user = user
    note.title = title
    note.text = text
    note.completed = completed

    const updatedNote = await note.save()

    res.json(`'${updatedNote.title}' updated`)
});

// @desc Delete note
// @route DELETE /notes
// @access Private
const deleteNote = asyncHandler(async(req, res) => {
    const {id} = req.body

    if(!id) {
        return res.status(400).json({message: 'Note ID required'})
    }

    const note = await Note.findById(id).exec()

    if(!note) {
        return res.status(400).json({message: 'Note not found'})
    }

    const result = await note.deleteOn()

    const reply = `Note ${result.title} with ID ${result.id} deleted`

    res.json(reply)
});

module.exports = {
    getAllNotes,
    createNewNote,
    editNote,
    deleteNote
};

