import express from 'express';
import dotenv from 'dotenv';
import cookieSession from 'cookie-session';

import { getAuthUrl, handleOAuthCallback, refreshAccessToken, validateAccessToken } from './googleAuth.js';
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
    // res.status(500).json({ error: "Failed to create Google Meet link." });
    res.json(err)
  }
});

app.get('/validate-token', async (req, res) => {
  const access_token = req.body.access_token
  if (!access_token) {
    return res.status(400).json({ error: 'Access token is required.' })
  }
  res.json(await validateAccessToken(access_token))
})

app.post('/auth/google/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is missing.' });
    }
    const newTokens = await refreshAccessToken(refreshToken);
    res.json(newTokens);
  } catch (error) {
    console.error('Error refreshing access token:', error);
    res.status(500).json({ error: 'Failed to refresh access token.' });
  }
});

app.listen(3000, () => console.log('Server started on http://localhost:3000'));
