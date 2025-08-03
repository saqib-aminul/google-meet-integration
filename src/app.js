import express from 'express';
import dotenv from 'dotenv';
import cookieSession from 'cookie-session';

import authRoutes from './routes/auth.js';
import calendarRoutes from './routes/calendar.js';
import { handleOAuthCallback } from './config/auth.js';

dotenv.config();
const app = express();
app.use(express.json());

app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_SECRET],
  maxAge: 24 * 60 * 60 * 1000
}));

// Routes
app.get('/', (req, res) => res.send('Welcome to the Google Meet Link Generator!'));

app.get('/google/callback', async (req, res) => {
    const code = req.query.code;
    const tokens = await handleOAuthCallback(code);
    req.session.tokens = tokens;
    res.json({ message: "Google authentication successful! here is your code", code, tokens });
});

app.use('/auth', authRoutes);  
app.use('/api/google/calendar', calendarRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));
