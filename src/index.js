import React from 'react';
import { render } from 'react-dom';
import './index.css';
import * as serviceWorker from './serviceWorker';

const HealthBar = ({ hp }) => (
  <div className="HealthBar">
    <div className="HealthBar__bar" style={{ width: `${hp}%` }}></div>
    <div className="HealthBar__number">{hp}%</div>
  </div>
);

const Arrow = ({ dir, pos, state }) => (
  <div className={`Arrow Arrow--${dir} Arrow--${state}`} style={{ transform: `translateX(${pos}px)` }}></div>
);

const Timeline = ({ arrows }) => (
  <div className="Timeline">
    <div className="Timeline__scope"></div>
    <div className="Timeline__scroll">
      {arrows.map(({ dir, pos, state }, i) => <Arrow key={i} dir={dir} pos={pos} state={state} />)}
    </div>
  </div>
);

const Sprite = ({ type, state }) => (
  <div className="Sprite">
    <img className="Sprite__image" src={`assets/chars/${type}/${state}.gif`} alt={type} />
  </div>
)

class App extends React.Component {
  constructor() {
    super();

    this.state = {
      myHp: 100,
      enemyHp: 100,
      key: null,
      arrows: Array(10).fill(null).map((_, i) => ({
        dir: this.randomDir(),
        pos: -800 + (i * 100),
        state: 'none'
      })),
      lastArrow: 9,
      playerState: 'idle',
      enemyState: 'walk',
      enemyX: 30,
      enemyHitAnimCd: 0,
      enemyAttackCd: 50,
      end: null
    };
  }

  randomDir = () => {
    const rand = Math.round(Math.random() * 3);
    switch (rand) {
      case 0: return 'up';
      case 1: return 'down';
      case 2: return 'left';
      case 3: return 'right';
      default: return;
    }
  }

  getDir = keyCode => {
    switch (keyCode) {
      case 38: return 'up';
      case 40: return 'down';
      case 37: return 'left';
      case 39: return 'right';
      default: return;
    }
  }

  frame = () => {
    let { enemyX, enemyState, enemyHitAnimCd, enemyHp, enemyAttackCd, myHp } = this.state;
    let playerDead = false;
    let enemyDead = false;

    // arrows movement and hit check
    let hit = false;
    let lastArrowPointer = this.state.lastArrow;
    const arrows = this.state.arrows.map(arrow => {
      const pos = arrow.pos + 2;
      let state = arrow.state;
      if (state === 'none') {
        if (pos >= 360 && pos <= 380 && this.state.key !== null) {
          if (this.state.key === arrow.dir) {
            state = 'ok';
            hit = true;
          } else {
            state = 'fail';
          }
        } else if (pos > 380) {
          state = 'fail';
        }
      }
      return { ...arrow, pos, state };
    });

    // cycle arrows
    const lastArrow = arrows[lastArrowPointer];
    if (lastArrow.pos > 780) {
      lastArrow.pos = -20;
      lastArrow.state = 'none';
      lastArrow.dir = this.randomDir();
      lastArrowPointer--;
      if (lastArrowPointer < 0) {
        lastArrowPointer = arrows.length - 1;
      }
    }

    // hit managment
    if (hit) {
      enemyHitAnimCd = 40;
      enemyAttackCd = 50;
      enemyHp -= 5;
      if (enemyHp <= 0) {
        enemyDead = true;
        enemyState = 'dead';
      }
    }

    // enemy behaviour
    if (!enemyDead) {
      if (enemyHitAnimCd > 0) {
        enemyHitAnimCd--;
        enemyState = 'hit';
      } else {
        if (enemyX < 630) {
          enemyX += 1;
          enemyState = 'walk';
        } else {
          enemyState = 'attack';
          if (enemyAttackCd > 0) {
            enemyAttackCd--;
          } else {
            enemyAttackCd = 100;
            myHp -= 25;
            if (myHp <= 0) {
              playerDead = true;
              enemyState = 'idle';
            }
          }
        }
      }
    }

    this.setState({
      ...this.state,
      key: null,
      arrows,
      myHp,
      enemyHp,
      enemyX,
      enemyState,
      enemyHitAnimCd,
      enemyAttackCd,
      lastArrow: lastArrowPointer
    });

    if (enemyDead || playerDead) {
      setTimeout(() => {
        this.setState({ ...this.state, end: enemyDead ? 'GG WP' : 'YOU DIED' });
      }, 100);
    } else {
      window.requestAnimationFrame(() => this.frame());
    }
  }

  componentDidMount() {

    window.addEventListener('keyup', ({ keyCode }) => {
      if ([38, 40, 37, 39].includes(keyCode)) {
        this.setState({ ...this.state, key: null });
      }
    });

    window.addEventListener('keydown', ({ keyCode }) => {
      if ([38, 40, 37, 39].includes(keyCode) && this.state.key === null) {
        this.setState({ ...this.state, key: this.getDir(keyCode) });
      }
    });

    window.requestAnimationFrame(() => this.frame());
  }

  render() {
    const { myHp, enemyHp, arrows, playerState, enemyState, enemyX, end } = this.state;
    return (
      <div className="App">
        <img className="App__background" src="assets/bgs/cascades.gif" alt="background" />

        <div className={`App__my-hp${end !== null ? ' hide' : ''}`}>
          <p>Me</p>
          <HealthBar hp={myHp} />
        </div>
        <div className={`App__enemy-hp${end !== null ? ' hide' : ''}`}>
          <p>Enemy</p>
          <HealthBar hp={enemyHp} />
        </div>

        <div className={`App__timeline${end !== null ? ' hide' : ''}`}>
          <Timeline arrows={arrows} />
        </div>

        <div className={`App__player${end !== null ? ' hide' : ''}`}>
          <Sprite type="player" state={playerState} />
        </div>
        <div className={`App__enemy App__enemy--${enemyState}${end !== null ? ' hide' : ''}`} style={{ right: `${enemyX}px` }}>
          <Sprite type="enemy" state={enemyState} />
        </div>

        <div className={`App__layer${end !== null ? ` App__layer--fadein App__layer--${end === 'GG WP' ? 'win' : 'loss'}` : ''}`}>
          <span className="App__layer-text">{end}</span>
        </div>
      </div>
    );
  }
}

render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.register();
