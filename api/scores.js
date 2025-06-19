import fs from 'fs';
import path from 'path';

const scoresFile = path.join(process.cwd(), 'data', 'scores.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Read scores from file
function readScores() {
  ensureDataDir();
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
  ensureDataDir();
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

  if (req.method === 'POST') {
    // Add new score
    const { username, email, score, level, lines } = req.body;
    
    if (!username || !email || !score) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const now = new Date();
    const newScore = {
      id: Date.now(),
      username: username.substring(0, 20), // Limit username length
      email: email.substring(0, 50), // Limit email length
      score: parseInt(score),
      level: parseInt(level) || 1,
      lines: parseInt(lines) || 0,
      timestamp: now.toISOString(),
      date: now.toDateString(),
      week: getWeekNumber(now)
    };

    const scores = readScores();
    scores.push(newScore);
    
    // Keep only last 1000 scores to prevent file from growing too large
    if (scores.length > 1000) {
      scores.splice(0, scores.length - 1000);
    }
    
    writeScores(scores);
    
    res.status(201).json({ success: true, score: newScore });
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
    
    // Sort by score descending and limit results
    const topScores = filteredScores
      .sort((a, b) => b.score - a.score)
      .slice(0, parseInt(limit));
    
    res.status(200).json(topScores);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
