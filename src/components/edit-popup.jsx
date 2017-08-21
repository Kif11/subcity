import React from 'react';
import axios from 'axios';
import styles from '../css/map.css';
import { Line, Circle } from 'rc-progress';


class Button extends React.Component {
  handleClick(e) {
    if (this.props.onClick){
      this.props.onClick(e);
    }
  }
  render() {
    return(
      <button
        className={styles.button}
        onClick={this.handleClick.bind(this)} disabled={this.props.disabled}>
        {this.props.name}
      </button>
    )
  }
}

class UploadButton extends React.Component {
  constructor(props) {
    super(props);
  }
  handleOnChange(e) {
    if (this.props.onChange){
      this.props.onChange(e);
    }
  }
  render() {
    let inputStyle = {
      width: '0.1px',
      height: '0.1px',
      opacity: 0,
      overflow: 'hidden',
      position: 'absolute',
      zIndex: -1
    }

    return (
      <div className={styles.button}>
        <input
          id='file-input'
          type='file'
          style={inputStyle}
          accept={this.props.accept}
          onChange={this.handleOnChange.bind(this)}
          multiple>
        </input>
        <label
          className={styles.uploadBtnLabel}
          htmlFor="file-input">
        {this.props.label}</label>
      </div>
    )
  }
}

export default class EditPopup extends React.Component {
  constructor(props) {
    super(props);
    this.uploadBtnLabel = 'Add Images';
    this.defaultCategory = 'Other';
    this.maxDescriptionLenth = 300;
    this.maxNameLenth = 35;
    this.maxImages = 8;
    this.state = {
      formValid: false,
      name: '',
      nameValid: false,
      category: this.props.categories[0].name,
      description: '',
      descriptionValid: true,
      images: [],
      uploadBtnLabel: this.uploadBtnLabel,
      uploadProgress: 0
    };
  }

  componentWillUnmount(e) {
    this.props.onUnmount(e);
  }

  componentDidMount(){
    // Focus on the first name input on this component creation
    this.nameInput.focus();
  }

  handleImageSelect(e) {
    let files = e.target.files;
    let label;

    if (files.length === 1) {
      label = `${files.length} image`;
    } else if (files.length > this.maxImages) {
      label = 'Too many images!';
    } else {
      label = `${files.length} images`;
    }

    this.setState({
      uploadBtnLabel: label,
      images: files
    });
  }

  handleRemoveImage(element) {
    let updatedImages = [];
    this.state.images.forEach((img, i) => {
      if (element.props.url === img.url) {
        console.log('[D] Removing', img);
        return;
      }
      updatedImages.push(img);
    });
    this.setState({images: updatedImages});
  }

  handleNameChange(e) {
    let val = e.target.value;
    if (/^([A-Za-z0-9 -]){3,35}$/.test(val)) {
      this.setState({
        nameValid: true,
        formValid: true
      });
    } else {
      this.setState({
        nameValid: false,
        formValid: false
      });
    };
    this.setState({name: val});
  }

  handleCategoryChange(e) {
    this.setState({category: e.target.value});
  }

  handleDescriptionChange(e) {
    let val = e.target.value;
    let pattern = new RegExp(`.{0,${this.maxDescriptionLenth}}`);
    if (pattern.test(val)) {
      this.setState({
        descriptionValid: true,
        formValid: true
      });
    } else {
      this.setState({
        descriptionValid: false,
        formValid: false
      });
    };
    this.setState({description: val});
  }

  render() {
    let edirPanelStyle = {
    }
    let categoriesOpt = [];
    this.props.categories.forEach((c, i) => {
      categoriesOpt.push(<option key={i} value={c.name}>{c.name}</option>)
    });

    let nameStyle = this.state.nameValid ? {} : {borderBottom: "1px solid #ff8f8f"};
    let descriptionStyle = this.state.descriptionValid ? {} : {borderColor: "#ff8f8f"};

    return (
      <div className={styles.editPopup} style={edirPanelStyle}>
        <div className={styles.editForm}>
          <h4>Create place</h4>
          <input
            type='text'
            name='name'
            placeholder='Type name'
            style={nameStyle}
            maxLength={this.maxNameLenth}
            ref={(input) => { this.nameInput = input; }}
            onChange={this.handleNameChange.bind(this)}></input>
          <select name='category'
            onChange={this.handleCategoryChange.bind(this)}>
            {categoriesOpt}
          </select>
          <textarea
            rows='4'
            cols='30'
            placeholder='Type description'
            name='description'
            style={descriptionStyle}
            maxLength={this.maxDescriptionLenth}
            onChange={this.handleDescriptionChange.bind(this)}>
          </textarea>
          <Line
            className={styles.progressBar}
            percent={this.props.progress}
            strokeWidth='2'
            strokeColor='#D3D3D3' />
        </div>
        <div className={styles.statusBar}>{this.props.status}</div>
        <div className={styles.buttonContainer}>
          <UploadButton
            label={this.state.uploadBtnLabel}
            accept='image/x-png,image/jpeg'
            onChange={this.handleImageSelect.bind(this)} />
          <Button
            name='Save'
            onClick={() => this.props.onSaveClick(this.state)}
            disabled={!this.state.formValid} />
        </div>
      </div>
    )
  }
}
