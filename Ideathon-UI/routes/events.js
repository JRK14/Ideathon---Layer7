const express = require('express');
const Event = require('../models/Event');
const router = express.Router();

// GET all events for a user
router.get('/:userId', async (req, res) => {
    try {
        const events = await Event.find({ user: req.params.userId });
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching events', error: error.message });
    }
});

// POST a new event
router.post('/', async (req, res) => {
    try {
        const { user, title, date, start, end, allDay, colorCls } = req.body;

        if (!user || !title || !date) {
            return res.status(400).json({ message: 'User, title, and date are required' });
        }

        const newEvent = await Event.create({
            user,
            title,
            date,
            start,
            end,
            allDay: allDay || false,
            colorCls: colorCls || 'blue-star'
        });

        // The frontend expects the id to be 'id', not '_id', so we might map it on the frontend or return it formatted.
        // It's usually easiest to let the frontend handle the mapping _id -> id.
        res.status(201).json(newEvent);
    } catch (error) {
        res.status(500).json({ message: 'Error creating event', error: error.message });
    }
});

// DELETE an event
router.delete('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: 'Event removed' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting event', error: error.message });
    }
});

module.exports = router;
