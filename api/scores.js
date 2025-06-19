import fs from 'fs';
import path from 'path';

const DATA_DIR = '/tmp';
const scoresFile = path.join(DATA_DIR, 'scores.json');

// Read scores from file
function readScores() {
  if (!fs.existsSync(scoresFile)) {
    return [];
  }
  try {
    const data = fs.readFileSync(scoresFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading scores:', error);
    return [];
  }
}

// Write scores to file
function writeScores(scores) {
  try {
    fs.writeFileSync(scoresFile, JSON.stringify(scores, null, 2));
  } catch (error) {
    console.error('Error writing scores:', error);
  }
}

// Get week number
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'POST') {
      // Add new score
      const { username, email, score, level, lines } = req.body;
      
      if (!username || !email || score === undefined || !username.trim()) {
        return res.status(400).json({ error: 'Missing required fields or invalid username' });
      }

      const now = new Date();
      const newScore = {
        id: Date.now(),
        username: String(username).trim().substring(0, 20),
        email: String(email).trim().substring(0, 50),
        score: Math.max(0, parseInt(score) || 0),
        level: Math.max(1, parseInt(level) || 1),
        lines: Math.max(0, parseInt(lines) || 0),
        timestamp: now.toISOString(),
        date: now.toDateString(),
        week: getWeekNumber(now)
      };

      const scores = readScores();
      
      // Remove existing entries for the same user on the same day
      const filteredScores = scores.filter(existingScore => 
        !(existingScore.email === newScore.email && existingScore.date === newScore.date)
      );
      
      filteredScores.push(newScore);
      
      // Keep only last 1000 scores
      if (filteredScores.length > 1000) {
        filteredScores.splice(0, filteredScores.length - 1000);
      }
      
      writeScores(filteredScores);
      
      return res.status(201).json({ success: true, score: newScore });
      
    } else if (req.method === 'GET') {
      // Get scores
      const { type = 'today', limit = 10 } = req.query;
      const scores = readScores();
      const now = new Date();
      const today = now.toDateString();
      const currentWeek = getWeekNumber(now);
      
      let filteredScores = scores;
      
      if (type === 'today') {
        filteredScores = scores.filter(score => score.date === today);
      } else if (type === 'week') {
        filteredScores = scores.filter(score => score.week === currentWeek);
      }
      
      // Filter out scores without valid usernames and sort by score descending
      const topScores = filteredScores
        .filter(score => score.username && score.username.trim())
        .sort((a, b) => b.score - a.score)
        .slice(0, parseInt(limit) || 10);
      
      return res.status(200).json(topScores);
      
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
