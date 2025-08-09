import express from 'express';
import { 
  createMeetEvent, 
  getCalendarEvents, 
  createCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent,
  watchCalendar,
  stopWatch
} from '../services/calendarService.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.get('/events', async (req, res) => {
  try {
    if (!req?.body?.tokens) {
      return res.status(401).json({ error: 'User not authenticated with Google.' });
    }

    const response = await getCalendarEvents(req.body.tokens);
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

// Start watching calendar for changes
router.post('/watch', async (req, res) => {
  try {
    if (!req.body.tokens) {
      return res.status(401).json({ error: 'User not authenticated with Google.' });
    }

    // Generate a unique channel ID
    const channelId = uuidv4();
    
    // The address should be your public HTTPS endpoint that will receive notifications
    const notificationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/api/google/calendar/notifications`;
    
    const channel = {
      id: channelId,
      address: notificationUrl,
      token: 'your-verification-token', // Optional but recommended for security
      type: 'web_hook'
    };

    const response = await watchCalendar(req.body.tokens, channel);

    console.log('response', JSON.stringify(response, null, 2));
    
    // Store the channel info in your database (you'll need to implement this)
    // await storeChannelInfo(req.user.id, {
    //   channelId: channel.id,
    //   resourceId: response.resourceId,
    //   expiration: response.expiration
    // });

    res.json({
      message: 'Watching calendar for changes',
      expiration: response.expiration,
      resourceId: response.resourceId
    });
  } catch (error) {
    console.error('Error setting up watch:', error);
    res.status(500).json({ error: 'Failed to set up watch.' });
  }
});

// Stop watching calendar
router.post('/stop-watch', async (req, res) => {
  try {
    if (!req.body.tokens || !req.body.channelId || !req.body.resourceId) {
      return res.status(400).json({ error: 'Missing required parameters.' });
    }

    await stopWatch(req.body.tokens, req.body.channelId, req.body.resourceId);
    
    // Remove the channel info from your database
    // await removeChannelInfo(req.body.channelId);

    res.json({ message: 'Stopped watching calendar' });
  } catch (error) {
    console.error('Error stopping watch:', error);
    res.status(500).json({ error: 'Failed to stop watch.' });
  }
});

// Handle incoming notifications from Google
router.post('/notifications', (req, res) => {
  console.log('Received notification', req.headers);
  // Verify the request is from Google (check X-Goog-Resource-State header)
  const resourceState = req.get('X-Goog-Resource-State');
  
  if (resourceState === 'sync') {
    // Initial sync notification, verify the channel
    console.log('Received sync notification');
    res.status(200).send('Sync notification received');
    return;
  }

  // Handle different types of changes
  if (resourceState === 'exists' || resourceState === 'not_exists') {
    const resourceId = req.get('X-Goog-Resource-ID');
    const channelId = req.get('X-Goog-Channel-ID');
    const channelToken = req.get('X-Goog-Channel-Token');
    
    console.log(`Received notification for channel ${channelId}, resource state: ${resourceState}`);
    
    // Process the change (fetch the updated event, update your database, etc.)
    // await processCalendarUpdate(resourceId);
    
    res.status(200).send('Notification received');
  } else {
    res.status(400).send('Invalid notification');
  }
});

export default router;
