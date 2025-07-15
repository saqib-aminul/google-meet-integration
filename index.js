import express from 'express';
import dotenv from 'dotenv';
import cookieSession from 'cookie-session';

import { getAuthUrl, handleOAuthCallback } from './googleAuth.js';
import { createMeetEvent } from './meetService.js';

dotenv.config();
const app = express();
app.use(express.json());

app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_SECRET],
  maxAge: 24 * 60 * 60 * 1000
}));

// --- Routes --- //
app.get('/auth/google', (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

app.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code;
  const tokens = await handleOAuthCallback(code);
  req.session.tokens = tokens;
  res.send("Google authentication successful! You may now create Meet links.");
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
