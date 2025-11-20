import { Router } from 'express';
import axios from 'axios';

const router = Router();

/**
 * GET /api/geocode/reverse
 * Reverse geocode coordinates to address
 */
router.get('/reverse', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse`,
      {
        params: {
          lat,
          lon: lng,
          format: 'json',
        },
        headers: {
          'User-Agent': 'RideShareApp/1.0 (contact@rideshare.com)',
        },
      }
    );

    return res.json(response.data);
  } catch (error: any) {
    console.error('Reverse geocode error:', error);
    return res.status(500).json({ 
      error: 'Failed to reverse geocode',
      message: error.message 
    });
  }
});

/**
 * GET /api/geocode/search
 * Search for location by query
 */
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 1 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search`,
      {
        params: {
          q,
          format: 'json',
          limit,
        },
        headers: {
          'User-Agent': 'RideShareApp/1.0 (contact@rideshare.com)',
        },
      }
    );

    return res.json(response.data);
  } catch (error: any) {
    console.error('Geocode search error:', error);
    return res.status(500).json({ 
      error: 'Failed to search location',
      message: error.message 
    });
  }
});

export default router;
