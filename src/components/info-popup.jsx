import React from "react";
import Linkify from 'react-linkify';
import placeholderImg from "../img/placeholder.jpg";
import styles from '../css/map.css';


export default class InfoPopup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      curImg: 0
    };
  }

  onPrevClick(e) {
    this.setState(prevState => {
      return {
        curImg: (prevState.curImg < 1) ?
          this.props.images.length - 1 :
          prevState.curImg - 1
      };
    });
  }

  onNextClick(e) {
    this.setState(prevState => {
      return {
        curImg: (prevState.curImg === this.props.images.length-1) ?
          0 :
          prevState.curImg + 1
      };
    });
  }

  render() {
    let images = this.props.images;

    let img;
    if (images.length === 0) {
      img = <img src={placeholderImg} />;
      nextBtn = null;
      prevBtn = null;
    } else {
      img = <img src={images[this.state.curImg].url} />;
    }

    let nextBtn;
    let prevBtn;

    if (images.length < 2) {
      // Do not show scroll buttons if we have less then 2 images
      nextBtn = null;
      prevBtn = null;
    } else {
      nextBtn = (
        <span
          className={styles.imgBtn}
          id={styles.prevBtn}
          onClick={this.onPrevClick.bind(this)}>
          &#60;
        </span>
      );
      prevBtn = (
        <span
          className={styles.imgBtn}
          id={styles.nextBtn}
          onClick={this.onNextClick.bind(this)}>
          &#62;
        </span>
      );
    }

    return (
      <div id={styles.infoPopupElement}>
        <div className={styles.imgContainer}>
          {img}
          {nextBtn}
          {prevBtn}
        </div>
        <h4>
          {this.props.title}
        </h4>
        <Linkify properties={{target: '_blank'}}>
          <p>
            {this.props.description}
          </p>
        </Linkify>        
      </div>
    );
  }
}
