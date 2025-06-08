import React from 'react';
import style from './index.less';
import { lan } from '../../unit/const';

export default class Leaderboard extends React.Component {
  constructor() {
    super();
    this.state = {
      scores: this.getTopScores(),
    };
  }

  shouldComponentUpdate() {
    return false;
  }

  getTopScores() {
    // Get scores from localStorage or return default scores
    const savedScores = localStorage.getItem('tetris_leaderboard');
    if (savedScores) {
      return JSON.parse(savedScores);
    }

    // Default realistic Tetris scores and classic player names
    return [
      { rank: 1, score: 1247850, name: 'TetrisKing' },
      { rank: 2, score: 985320, name: 'BlockMaster' },
      { rank: 3, score: 756890, name: 'LineClearing' },
      { rank: 4, score: 623450, name: 'SpeedRunner' },
      { rank: 5, score: 487210, name: 'T-SpinPro' },
      { rank: 6, score: 356780, name: 'ComboMaker' },
      { rank: 7, score: 234560, name: 'LevelCrusher' },
      { rank: 8, score: 178920, name: 'StackMaster' },
      { rank: 9, score: 123450, name: 'FallingStar' },
      { rank: 10, score: 89670, name: 'BlockBuster' },
    ];
  }

  getLabels() {
    if (lan === 'en') {
      return {
        title: 'Leaderboard',
        rank: 'Rank',
        player: 'Player',
        score: 'Score',
      };
    }
    return {
      title: '排行榜',
      rank: '排名',
      player: '玩家',
      score: '分数',
    };
  }

  render() {
    const labels = this.getLabels();

    return (
      <div className={style.leaderboard}>
        <h2>{labels.title}</h2>
        <div className={style.content}>
          <div className={style.header}>
            <span className={style.rank}>{labels.rank}</span>
            <span className={style.name}>{labels.player}</span>
            <span className={style.score}>{labels.score}</span>
          </div>
          <div className={style.list}>
            {this.state.scores.map((item, index) => (
              <div key={index} className={`${style.item} ${index < 3 ? style.top3 : ''}`}>
                <span className={style.rank}>
                  {index < 3 ? ['🥇', '🥈', '🥉'][index] : item.rank}
                </span>
                <span className={style.name}>{item.name}</span>
                <span className={style.score}>{item.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
}
