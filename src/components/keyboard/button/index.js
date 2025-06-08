import React from 'react';
import cn from 'classnames';
import propTypes from 'prop-types';

import style from './index.less';
import { transform } from '../../../unit/const';

const getIcon = (iconType) => {
  const iconStyle = {
    fill: '#c0c0c0',
    width: '20px',
    height: '20px',
  };

  const rotatePath = 'M12,6V9L16,5L12,1V4A8,8 0 0,0 4,12C4,13.57 4.46,15.03 5.24,16.26L6.7,14.8' +
    'C6.25,13.97 6,13 6,12A6,6 0 0,1 12,6M18.76,7.74L17.3,9.2C17.74,10.04 18,11 18,12A6,6 ' +
    '0 0,1 12,18V15L8,19L12,23V20A8,8 0 0,0 20,12C20,10.43 19.54,8.97 18.76,7.74Z';

  const resetPath = 'M12,4C14.1,4 16.1,4.8 17.6,6.3C20.7,9.4 20.7,14.5 17.6,17.6C15.8,19.5 ' +
    '13.3,20.2 10.9,19.9L11.4,17.9C13.1,18.1 14.9,17.5 16.2,16.2C18.5,13.9 18.5,10.1 ' +
    '16.2,7.7C15.1,6.6 13.5,6 12,6V10.5L7,5.5L12,0.5V4M6.3,17.6C3.7,15 3.3,11 5.1,7.9L6.6,' +
    '9.4C5.5,11.6 5.9,14.4 7.8,16.2C8.3,16.7 8.9,17.1 9.6,17.4L9,19.4C8,19 7.1,18.4 6.3,17.6Z';

  const soundPath = 'M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77' +
    'C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16' +
    'C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z';

  const icons = {
    rotate: (
      <svg viewBox="0 0 24 24" style={iconStyle}>
        <path d={rotatePath} />
      </svg>
    ),
    down: (
      <svg viewBox="0 0 24 24" style={iconStyle}>
        <path d="M7,10L12,15L17,10H7Z" />
      </svg>
    ),
    left: (
      <svg viewBox="0 0 24 24" style={iconStyle}>
        <path d="M14,7L9,12L14,17V7Z" />
      </svg>
    ),
    right: (
      <svg viewBox="0 0 24 24" style={iconStyle}>
        <path d="M10,17L15,12L10,7V17Z" />
      </svg>
    ),
    drop: (
      <svg viewBox="0 0 24 24" style={iconStyle}>
        <path d="M7,10L12,15L17,10H7M12,2L7,7H10V14H14V7H17L12,2Z" />
      </svg>
    ),
    reset: (
      <svg viewBox="0 0 24 24" style={iconStyle}>
        <path d={resetPath} />
      </svg>
    ),
    sound: (
      <svg viewBox="0 0 24 24" style={iconStyle}>
        <path d={soundPath} />
      </svg>
    ),
    pause: (
      <svg viewBox="0 0 24 24" style={iconStyle}>
        <path d="M14,19H18V5H14M6,19H10V5H6V19Z" />
      </svg>
    ),
  };

  return icons[iconType] || null;
};

export default class Button extends React.Component {
  shouldComponentUpdate(nextProps) {
    return nextProps.active !== this.props.active;
  }
  render() {
    const {
      active, color, size, top, left, label, position, arrow, icon, buttonText,
    } = this.props;
    return (
      <div
        className={cn({ [style.button]: true, [style[color]]: true, [style[size]]: true })}
        style={{ top, left }}
      >
        <i
          className={cn({ [style.active]: active })}
          ref={(c) => { this.dom = c; }}
        />
        { size === 's1' && !icon && <em
          style={{
            [transform]: `${arrow} scale(1,2)`,
          }}
        /> }
        { icon && <div className={style.icon}>
          {getIcon(icon)}
        </div> }
        { icon && buttonText && <div className={style.buttonText}>
          {buttonText}
        </div> }
        <span className={cn({ [style.position]: position, [style.hidden]: !!icon })}>{label}</span>
      </div>
    );
  }
}

Button.propTypes = {
  color: propTypes.string.isRequired,
  size: propTypes.string.isRequired,
  top: propTypes.number.isRequired,
  left: propTypes.number.isRequired,
  label: propTypes.string.isRequired,
  position: propTypes.bool,
  arrow: propTypes.string,
  active: propTypes.bool.isRequired,
  icon: propTypes.string,
  buttonText: propTypes.string,
};

