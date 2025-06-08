import React from 'react';
import style from './index.less';
import { lan } from '../../unit/const';

export default class GameIntro extends React.Component {
  shouldComponentUpdate() {
    return false;
  }

  getContent() {
    if (lan === 'en') {
      return {
        title: 'About Us',
        aboutText: 'freeteris.shop is an online platform designed for Tetris enthusiasts! ' +
          'Here, you can play the classic Tetris game for free without downloading or ' +
          'registration. Whether you\'re a nostalgic player or a newcomer, our website ' +
          'provides you with a simple and smooth gaming experience.',
        whatIsTetris: 'What is Tetris?',
        tetrisDescription: 'Tetris is a classic puzzle game where players need to arrange ' +
          'falling blocks (called Tetriminos) to form complete horizontal lines and eliminate ' +
          'them. This game tests your spatial thinking and reaction speed, simple yet ' +
          'challenging, loved by players worldwide.',
        controls: 'Controls',
        controlsList: [
          '← → Control left and right movement',
          '↓ Control descent',
          '↑ Rotate blocks',
          'Space Drop directly',
        ],
        gameRules: 'Game Rules',
        rulesList: [
          'Eliminate full lines to score points',
          'Eliminating multiple lines simultaneously scores higher',
          'Speed increases with level',
          'Game ends when blocks reach the top',
        ],
        shortcuts: 'Shortcuts',
        shortcutsList: [
          'P - Pause/Resume',
          'R - Restart',
          'S - Sound toggle',
        ],
      };
    }

    return {
      title: '关于我们',
      aboutText: 'freeteris.shop 是一个专为俄罗斯方块爱好者打造的在线平台！在这里，您可以免费畅玩经典的俄罗斯方块游戏，' +
        '无需下载或注册。无论您是怀旧玩家还是新手，我们的网站都为您提供了一个简单、流畅的游戏体验。',
      whatIsTetris: '什么是俄罗斯方块？',
      tetrisDescription: '俄罗斯方块是一款经典的益智游戏，玩家需要排列下落的方块（称为 Tetriminos），' +
        '以组成完整的水平线并消除它们。这款游戏考验您的空间思维和反应速度，既简单又充满挑战，深受全球玩家喜爱。',
      controls: '操作说明',
      controlsList: [
        '← → 控制左右移动',
        '↓ 控制下降',
        '↑ 旋转方块',
        '空格 直接落下',
      ],
      gameRules: '游戏规则',
      rulesList: [
        '消除整行获得分数',
        '同时消除多行得分更高',
        '速度会随等级提升',
        '方块堆到顶部游戏结束',
      ],
      shortcuts: '快捷键',
      shortcutsList: [
        'P - 暂停/继续',
        'R - 重新开始',
        'S - 音效开关',
      ],
    };
  }

  render() {
    const content = this.getContent();

    return (
      <div className={style.gameIntro}>
        <h2>{content.title}</h2>
        <div className={style.content}>
          <p>{content.aboutText}</p>

          <h3>{content.whatIsTetris}</h3>
          <p>{content.tetrisDescription}</p>

          <h3>{content.controls}</h3>
          <ul>
            {content.controlsList.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h3>{content.gameRules}</h3>
          <ul>
            {content.rulesList.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h3>{content.shortcuts}</h3>
          <ul>
            {content.shortcutsList.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
}
