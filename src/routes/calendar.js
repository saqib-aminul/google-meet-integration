import express from 'express';
import { 
  createMeetEvent, 
  getCalendarEvents, 
  createCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent 
} from '../services/calendarService.js';

const router = express.Router();

router.get('/events', async (req, res) => {
  try {
    if (!req.session.tokens) {
      return res.status(401).json({ error: 'User not authenticated with Google.' });
    }

    const response = await getCalendarEvents(req.session.tokens);
    res.json({response});
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events.' });
  }
});

router.post('/events', async (req, res) => {
  if (!req.body.tokens) {
    return res.status(401).json({ error: 'User not authenticated with Google.' });
  }

  try {
    const { tokens, ...eventData } = req.body;
    const event = await createCalendarEvent(tokens, eventData);
    res.json(event);
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ error: 'Failed to create calendar event.' });
  }
});

router.put('/events/:eventId', async (req, res) => {
  if (!req.body.tokens) {
    return res.status(401).json({ error: 'User not authenticated with Google.' });
  }

  try {
    const { tokens, ...eventData } = req.body;
    const { eventId } = req.params;
    const event = await updateCalendarEvent(tokens, eventId, eventData);
    res.json(event);
  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({ error: 'Failed to update calendar event.' });
  }
});

router.delete('/events/:eventId', async (req, res) => {
  if (!req.body.tokens) {
    return res.status(401).json({ error: 'User not authenticated with Google.' });
  }

  try {
    const { tokens } = req.body;
    const { eventId } = req.params;
    await deleteCalendarEvent(tokens, eventId);
    res.json({ message: 'Event deleted successfully.' });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ error: 'Failed to delete calendar event.' });
  }
});

router.post('/meet/create', async (req, res) => {
  if (!req.body.tokens) {
    return res.status(401).json({ error: "User not authenticated with Google." });
  }

  try {
    const { tokens, startTime, endTime, attendees = [] } = req.body;
    const meetLink = await createMeetEvent(tokens, {
      startTime,
      endTime,
      attendees
    });

    res.json({ meetLink });
  } catch (err) {
    console.error(err);
    res.json(err)
  }
});

export default router;
