import express from 'express';
import dotenv from 'dotenv';
import cookieSession from 'cookie-session';

import { getAuthUrl, handleOAuthCallback } from './googleAuth.js';
import { createMeetEvent, getCalendarEvents } from './meetService.js';

dotenv.config();
const app = express();
app.use(express.json());

app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_SECRET],
  maxAge: 24 * 60 * 60 * 1000
}));

// --- Routes --- //
app.get('/', (req, res) => res.send('Welcome to the Google Meet Link Generator!'))

app.get('/auth/google', (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

app.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code;
  const tokens = await handleOAuthCallback(code);
  req.session.tokens = tokens;
  res.json({ message: "Google authentication successful! here is your code", code, tokens });
});

app.get('/api/google/tokens', async (req, res) => {
  try {
    const code = req.query.code;
    console.log('code: ', code)
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is missing.' });
    }
    const tokens = await handleOAuthCallback(code);
    console.log('tokens: ', tokens)
    res.json(tokens);
  } catch (error) {
    console.error('Error exchanging authorization code:', error);
    res.status(500).json({ error: 'Failed to exchange authorization code for tokens.' });
  }
});

app.get('/api/google/calendar-events', async (req, res) => {
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

app.post('/google-meet/create', async (req, res) => {
  if (!req.session.tokens) {
    return res.status(401).json({ error: "User not authenticated with Google." });
  }

  try {
    const { startTime, endTime, attendees = [] } = req.body;
    const meetLink = await createMeetEvent(req.session.tokens, {
      startTime,
      endTime,
      attendees
    });

    res.json({ meetLink });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create Google Meet link." });
  }
});

app.listen(3000, () => console.log('Server started on http://localhost:3000'));
