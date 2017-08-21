import React from 'react';
import addImg from '../img/add.png';
import closeImg from '../img/close.png';
import styles from '../css/map.css';


export default class ButtonPopup extends React.Component {
  render() {
    return (
      <div className={styles.buttonContainer}>
        <input
          className={styles.button}
          onClick={this.props.onAddClick}
          type="image"
          src={addImg}
          value="+"></input>
        <input
          className={styles.button}
          onClick={this.props.onCloseClick}
          type="image"
          src={closeImg}
          value="close"></input>
      </div>
    )
  }
}
