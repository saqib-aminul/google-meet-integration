import express from 'express';
import dotenv from 'dotenv';
import cookieSession from 'cookie-session';

import authRoutes from './routes/auth.js';
import calendarRoutes from './routes/calendar.js';

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

app.use('/auth', authRoutes);
app.use('/api/google/calendar', calendarRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));
