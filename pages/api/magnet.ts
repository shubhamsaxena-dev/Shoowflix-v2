import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { hash, title } = req.body;
    
    if (!hash || !title) {
      return res.status(400).json({ error: 'Hash and title are required' });
    }

    const trackers = [
      'udp://tracker.opentrackr.org:1337/announce',
      'udp://glotorrents.pw:6969/announce',
      'udp://tracker.openbittorrent.com:80',
      'udp://tracker.coppersurfer.tk:6969',
      'udp://tracker.leechers-paradise.org:6969'
    ];
    
    const encodedTitle = encodeURIComponent(title);
    const trackerParams = trackers.map(tracker => `tr=${encodeURIComponent(tracker)}`).join('&');
    
    const magnetLink = `magnet:?xt=urn:btih:${hash}&dn=${encodedTitle}&${trackerParams}`;
    
    res.json({ magnetLink });
  } catch (error) {
    console.error('Error generating magnet link:', error);
    res.status(500).json({ 
      error: 'Failed to generate magnet link',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}