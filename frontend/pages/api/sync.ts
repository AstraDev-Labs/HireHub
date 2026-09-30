import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

export default withApiAuthRequired(async function sync(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  
  if (!session || !session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const response = await axios.post('http://localhost:5000/api/auth/internal-sync', {
      user: session.user
    }, {
      headers: {
        'x-internal-secret': process.env.AUTH0_SECRET || ''
      }
    });

    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Backend sync error:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
