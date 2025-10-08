// /pages/api/rebuild-sitemap.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Trigger a Vercel deploy via webhook
    await fetch('https://api.vercel.com/v1/integrations/deploy/prj_w2zxfLarW7IgTYYjO1IMplxY7uHb/3yMdup1v8T', {
      method: 'POST',
    });

    res.status(200).json({ message: 'Sitemap rebuild triggered' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to trigger rebuild' });
  }
}
