import { Leaderboard } from '../../../lib/storage.js';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const board = req.query.board || 'balance';
  const lb = Leaderboard.get();
  const entries = (lb[board] || []).slice(0, parseInt(req.query.limit||'10'));
  const boards = ['balance','auraskills','votes'].filter(b => (lb[b]||[]).length > 0);
  res.setHeader('Cache-Control','public,s-maxage=60');
  return res.json({ success:true, board, entries, availableBoards: boards, lastSync: lb.lastSync?.[board]||null });
}
