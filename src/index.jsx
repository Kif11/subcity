import React from 'react';
import ReactDOM from 'react-dom';
import ReactMapboxGl, { Layer, Feature, Popup } from "react-mapbox-gl";
import axios from 'axios';
import enquire from 'enquire.js';

import EditPopup from './components/edit-popup';
import InfoPopup from './components/info-popup';
import ButtonPopup from './components/button-popup';

import styles from './css/map.css';

const MapboxGl = ReactMapboxGl({
  accessToken: 'pk.eyJ1Ijoia2lmMTEiLCJhIjoiY2ozbHVoYXVuMDB5YjMybXkzMTlpOHRrdCJ9.f8F1dVwwOJhkEkTbnNoFag'
});

class InfoBox extends React.Component {
  render() {
    return <div className={styles.infoBox}></div>;
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.placesDataFile = 'data/places.json';
    this.state = {
      places: {
          "type": "FeatureCollection",
          "features": [],
      },
      coordinates: [0, 0],
      activePopup: null,
      mapZoom: [12],
      mapCenter: [-122.420679, 37.772537],  // San Francisco
      featureTitle: '',
      featureCategory: '',
      featureImages: [],
      featureDescription: '',
      uploadProgress: 0,
      circleSize: 8
    }

    this.categories = [
      {
        name: 'Other',
        color: '#babec2'
      },
      {
        name: 'Studios',
        color: '#ab85ee'
      },
      {
        name: 'Accomodation',
        color: '#f4d179'
      },
      {
        name: 'Food',
        color: '#ee6565'
      },
      {
        name: 'Water Holes',
        color: '#2196f3'
      },
      {
        name: 'Hangout',
        color: '#9bf07c'
      }
    ]

    this.stopsCategories = [];
    this.categories.forEach((category, i) => {
      this.stopsCategories.push([category.name, category.color])
    });

    this.axios = axios.create({
      // Handle default XMLHttpRequest onprogress callback
      onUploadProgress: this.handleUploadProgress.bind(this)
    });
  }

  componentWillMount () {
    // Load places fata form server
    axios.get('/getfeatures').then((res) => {
      this.setState({places: res.data});
    }).catch(err => {
      console.log('[-] Error while fetching features from server.', err);
    })
  }

  componentDidMount() {
    enquire.register('(max-width: 700px)', {
      match: () => {
        console.log('Screen is less then 700px');
        this.setState({
          circleSize: 18
        });
      },
      unmatch: () => {
        console.log('Screen is more then 700px');
        this.setState({
          circleSize: 8
        });
      }
    })
  }

  handleMapDataLoaded(data) {
    this.setState({places: data});
  }

  handleMapClick(map, e) {
    let renderFeature = map.queryRenderedFeatures(
      e.point,
      {layers: ['places']}
    );

    if (renderFeature.length > 0) {
      // User click on existing feature. Skip
      this.handleFeatureClick(map, e, renderFeature[0]);
      return;
    }

    this.setState(previousState => {
      return {
        coordinates: e.lngLat,
        activePopup: 'buttons',
        // This is mapbox-gl react bug where
        // popup position won't updata until zoom. Anoing :(
        mapZoom: [previousState.mapZoom[0] + 0.0001]
      };
    });
  }

  handleFeatureClick(map, e, feature) {
    this.setState(previousState => {
      return {
        coordinates: e.lngLat,
        mapCenter: e.lngLat,
        activePopup: 'info',
        mapZoom: [previousState.mapZoom[0] + 0.0001],
        featureTitle: feature.properties.title,
        featureCategory: feature.properties.category,
        // This is array of images as a string. Don't forget to parse it
        featureImages: JSON.parse(feature.properties.images),
        featureDescription: feature.properties.description
      };
    });
  }

  handleZoomEnd(e) {
    this.setState({mapZoom: [e.getZoom()]});
  }

  handleDragEnd(e) {
    this.setState({mapCenter: e.getCenter()});
  }

  featureSaveSuccess(res) {
    let feature = res.data;

    // Create a new array of features
    let newFeatures = this.state.places.features.concat([feature]);
    // Deep copy places object
    let newPlaces = JSON.parse(JSON.stringify(this.state.places));
    // Set features to our new features
    newPlaces.features = newFeatures;

    // Update state and dispalay info popup
    this.setState({
      places: newPlaces,
      featureTitle: feature.properties.title,
      featureCategory: feature.properties.category,
      featureImages: feature.properties.images,
      featureDescription: feature.properties.description,
      activePopup: 'info',
      featureSaveStatus: '',
      uploadProgress: 0
    });
  }

  featureSaveFailure(err) {
    this.setState({
      featureSaveStatus: err.response.data,
      uploadProgress: 0
    });
    console.log('Faled to save.', err.response.data);
  }

  handleSaveClick(data) {
    let images = data.images;
    let form = new FormData();

    form.append('coordinates', [
      this.state.coordinates.lng,
      this.state.coordinates.lat
    ]);
    form.append('name', data.name);
    form.append('category', data.category);
    form.append('description', data.description);

    for (let i = 0; i < images.length; i++) {
      form.append('images', images[i]);
    }

    this.axios.post('/addfeature', form)
      .then(res => {
        this.featureSaveSuccess(res);
      })
      .catch(err => {
        this.featureSaveFailure(err);
      });
  }

  handleUploadProgress(e) {
    if (e.lengthComputable) {
      let percentage = (e.loaded / e.total) * 100;
      let progress = parseInt(percentage);
      // console.log('[D]' + progress + '%');
      this.setState({uploadProgress: progress});
    }
  }

  hanndleAddClick(e) {
    this.setState({
      mapCenter: this.state.coordinates,
      activePopup: 'edit'
    });
  }

  handleCloseClick(e) {
    this.setState({activePopup: null});
  }

  handleFeatureEnter(e) {
    e.map.getCanvas().style.cursor = 'pointer';
  }

  handleFeatureLeave(e) {
    e.map.getCanvas().style.cursor = 'default';
  }

  handleEditPopupUnmount(e) {
    // Clear edir error status
    this.setState({featureSaveStatus: ''});
  }

  render() {

    let paint = {
      "circle-radius": {
          "base": 1.5,
          "stops": [[12, this.state.circleSize]]
      },
      "circle-color": {
          "property": "category",
          "type": "categorical",
          "stops": this.stopsCategories
      },
      "circle-opacity": 0.8
    }

    let features = [];
    this.state.places.features.forEach((feature, i) => {
      features.push(
        <Feature
          key={i}
          coordinates={feature.geometry.coordinates}
          properties={feature.properties}
          onMouseEnter={this.handleFeatureEnter}
          onMouseLeave={this.handleFeatureLeave} />
      );
    });

    let popup;
    let mbClass = 'mapboxgl-popup mapboxgl-popup-anchor-bottom';
    switch(this.state.activePopup) {
      case 'buttons':
        popup = <Popup
          className={`${mbClass} ${styles.buttonPopup}`}
          anchor='bottom'
          coordinates={this.state.coordinates}>
          <ButtonPopup
            onAddClick={this.hanndleAddClick.bind(this)}
            onCloseClick={this.handleCloseClick.bind(this)} />
        </Popup>;
        break;
      case 'info':
        popup = <Popup
          className={`${mbClass} ${styles.infoPopup}`}
          anchor='bottom'
          coordinates={this.state.coordinates}>
          <InfoPopup
            title={this.state.featureTitle}
            description={this.state.featureDescription}
            images={this.state.featureImages} />
        </Popup>;
        break;
      case 'edit':
        popup = <Popup
          className={`${mbClass} ${styles.editPopup}`}
          anchor='bottom'
          coordinates={this.state.coordinates}>
          <EditPopup
            onSaveClick={this.handleSaveClick.bind(this)}
            onUnmount={this.handleEditPopupUnmount.bind(this)}
            categories={this.categories}
            coordinates={this.state.coordinates}
            status={this.state.featureSaveStatus}
            progress={this.state.uploadProgress} />
        </Popup>;
        break;
      default:
        popup = null;
    }

    return (
      <div id='app-container'>
        <h1 className={styles.mapTitle}>subcity</h1>
        <MapboxGl
          clasName="main-map"
          style="mapbox://styles/mapbox/light-v9"
          center={this.state.mapCenter}
          zoom={this.state.mapZoom}
          onZoomEnd={this.handleZoomEnd.bind(this)}
          onDragEnd={this.handleDragEnd.bind(this)}
          containerStyle={{
            height: "100vh",
            width: "100vw"
          }}
          onClick={this.handleMapClick.bind(this)}>
            <Layer
              type="circle"
              id="places"
              paint={paint}>
              {features}
            </Layer>
            {popup}
        </MapboxGl>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
