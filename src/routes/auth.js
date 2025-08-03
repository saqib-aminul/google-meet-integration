import express from 'express';
import { getAuthUrl, handleOAuthCallback, refreshAccessToken, validateAccessToken } from '../config/auth.js';

const router = express.Router();

router.get('/google', (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});


router.get('/google/tokens', async (req, res) => {
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

router.post('/google/refresh-token', async (req, res) => {
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

router.get('/validate-token', async (req, res) => {
  const access_token = req.body.access_token
  if (!access_token) {
    return res.status(400).json({ error: 'Access token is required.' })
  }
  res.json(await validateAccessToken(access_token))
});

export default router;
