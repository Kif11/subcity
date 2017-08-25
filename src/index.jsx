import React from 'react'
import ReactDOM from 'react-dom'
import ReactMapboxGl, { Layer, Feature, Popup, Marker } from 'react-mapbox-gl';
import axios from 'axios'
import enquire from 'enquire.js'

import EditPopup from './components/edit-popup'
import InfoPopup from './components/info-popup'
import ButtonPopup from './components/button-popup'

import styles from './css/map.css'

const MapboxGl = ReactMapboxGl({
  accessToken: 'pk.eyJ1Ijoia2lmMTEiLCJhIjoiY2ozbHVoYXVuMDB5YjMybXkzMTlpOHRrdCJ9.f8F1dVwwOJhkEkTbnNoFag'
})

class App extends React.Component {
  constructor (props) {
    super(props)
    this.placesDataFile = 'data/places.json'
    this.state = {
      places: {
        'type': 'FeatureCollection',
        'features': []
      },
      markers: [],
      coordinates: [0, 0],
      activePopup: null,
      prevZoom: [12],
      mapZoom: [12],
      mapCenter: [-122.420679, 37.772537], // San Francisco
      featureTitle: '',
      featureCategory: '',
      featureImages: [],
      featureDescription: '',
      uploadProgress: 0,
      circleSize: 8
    }

    this.smallScreen = false

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

    this.stopsCategories = []
    this.categories.forEach((category, i) => {
      this.stopsCategories.push([category.name, category.color])
    })

    this.axios = axios.create({
      // Handle default XMLHttpRequest onprogress callback
      onUploadProgress: this.handleUploadProgress.bind(this)
    })

    this.defaultLat = 37.772537;
    this.defaultLng = -122.420679;
    this.defaultZoom = 12;
  }

  updateUrl(center, zoom) {
    // Update address bar url with new map coordinates and zoom
    let newParms = `${document.location.origin}/?lat=${center.lat}&lng=${center.lng}&zoom=${zoom}`;

    history.replaceState({
      lng: center.lng,
      lat: center.lat,
      zoom: [zoom]
    }, 'subcity', newParms);
  }

  addMarkers(markers) {

    img = img || 'favicon.png'
    let newMarker = {
      coordinates: coordinates,
      img: img
    };

    let newMarkers = this.state.markers.concat([newMarker]);

    this.setState({
      markers: newMarkers
    });
    
    // this.setState(prevState => {
    //   return {
    //     markers: prevState.markers.push(newMarker)
    //   }
    // });
  }

  componentWillMount () {

    // User click browser back button
    window.onpopstate = (e) => {
      let center = {lng: this.defaultLng, lat: this.defaultLat};
      this.updateUrl(center, this.defaultZoom);
      this.setState({
        mapCenter: center,
        mapZoom: this.defaultZoom
      });
    }

    // Get starting coordinates and zoom from URL parameters
    // e.g. submap.tk?lat=37.7786149&lng=-122.392441&zoom=16
    let lat = parseFloat(this.getParameterByName('lat'));
    if (!lat) {
      lat = this.defaultLat;
    }
    if (lat > 90 || lat < -90) {
      // Latitude must be in between 90 and -90
      lat = this.defaultLat;
    }
    let lng = parseFloat(this.getParameterByName('lng'));
    if (!lng) {
      lng = this.defaultLng;
    }
    let zoom = parseFloat(this.getParameterByName('zoom'));
    if (!zoom) {
      zoom = this.defaultZoom;
    }

    let center = {lng: lng, lat: lat};

    let markersStr = this.getParameterByName('markers');
    if (markersStr) {

      console.log('Markers String', markersStr);
      
      let markers = JSON.parse(markersStr);
    
      this.setState({markers: markers});
    }

    this.updateUrl(center, zoom);

    this.setState({
      mapCenter: center,
      mapZoom: [zoom]
    });

    // Load places fata form server
    axios.get('/getfeatures').then((res) => {
      this.setState({places: res.data})
    }).catch(err => {
      console.log('[-] Error while fetching features from server.', err)
    })
  }

  getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"), 
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  componentDidMount () {

    // This hack is to prevent zoom on popup and other element on IOS Safari
    // https://stackoverflow.com/questions/4389932/how-do-you-disable-viewport-zooming-on-mobile-safari
    document.addEventListener('touchmove', function (event) {
      if (event.scale !== 1) { event.preventDefault() }
    }, false)
    // Disable double tap zoom as well
    var lastTouchEnd = 0
    document.addEventListener('touchend', function (event) {
      var now = (new Date()).getTime()
      if (now - lastTouchEnd <= 300) {
        event.preventDefault()
      }
      lastTouchEnd = now
    }, false)

    // Register some media quiries here
    enquire.register('(max-width: 700px)', {
      match: () => {
        // console.log('[D] Screen is less then 700px');
        this.smallScreen = true
        this.setState({
          circleSize: 18
        })
      },
      unmatch: () => {
        // console.log('[D] Screen is more then 700px');
        this.smallScreen = false
        this.setState({
          circleSize: 8
        })
      }
    })
  }

  handleMapDataLoaded (data) {
    this.setState({places: data})
  }

  handleMapClick (map, e) {
    let renderFeature = map.queryRenderedFeatures(
      e.point,
      {layers: ['places']}
    )

    if (renderFeature.length > 0) {
      // User click on existing feature. Skip
      this.handleFeatureClick(map, e, renderFeature[0])
      return
    }

    this.setState(previousState => {
      return {
        coordinates: e.lngLat,
        activePopup: 'buttons',
        // This is mapbox-gl react bug where
        // popup position won't updata until zoom. Annoying :(
        mapZoom: [previousState.mapZoom[0] + 0.00001]
      }
    })
  }

  handleFeatureClick (map, e, feature) {
    let center
    if (this.smallScreen) {
      center = e.lngLat
    } else {
      center = this.state.mapCenter
    }

    this.setState(previousState => {
      return {
        coordinates: e.lngLat,
        mapCenter: center,
        activePopup: 'info',
        mapZoom: [previousState.mapZoom[0] + 0.00001],
        featureTitle: feature.properties.title,
        featureCategory: feature.properties.category,
        // This is array of images as a string. Don't forget to parse it
        featureImages: JSON.parse(feature.properties.images),
        featureDescription: feature.properties.description
      }
    })
  }

  handleZoomEnd (e) {
    
    let center = e.getCenter();
    let zoom = e.getZoom();

    // When zooming on touchscreen device this zoom callback trigered
    // while zooming and not on the zoom end! To prevent url from updating
    // we have to do this wacky bussines
    let zoomDiff = Math.abs(zoom - this.state.prevZoom[0]);
    if (zoomDiff > 1) {
      this.updateUrl(center, zoom);
    }

    this.setState(previousState => {
      return {
        mapZoom: [zoom],
        prevZoom: previousState.mapZoom
      }
    });

  }

  handleDragEnd (e) {
    let center = e.getCenter();
    let zoom = e.getZoom();
    this.updateUrl(center, zoom);
    this.setState({
      mapCenter: center
    });
  }

  handlePithEnd(e) {
    console.log('Pitch end');
    
  }

  featureSaveSuccess (res) {
    let feature = res.data

    // Create a new array of features
    let newFeatures = this.state.places.features.concat([feature])
    // Deep copy places object
    let newPlaces = JSON.parse(JSON.stringify(this.state.places))
    // Set features to our new features
    newPlaces.features = newFeatures

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
    })
  }

  featureSaveFailure (err) {
    this.setState({
      featureSaveStatus: err.response.data,
      uploadProgress: 0
    })
    console.log('Faled to save.', err.response.data)
  }

  handleSaveClick (data) {
    let images = data.images
    let form = new FormData()

    form.append('coordinates', [
      this.state.coordinates.lng,
      this.state.coordinates.lat
    ])
    form.append('name', data.name)
    form.append('category', data.category)
    form.append('description', data.description)

    for (let i = 0; i < images.length; i++) {
      form.append('images', images[i])
    }

    this.axios.post('/addfeature', form)
      .then(res => {
        this.featureSaveSuccess(res)
      })
      .catch(err => {
        this.featureSaveFailure(err)
      })
  }

  handleUploadProgress (e) {
    if (e.lengthComputable) {
      let percentage = (e.loaded / e.total) * 100
      let progress = parseInt(percentage)
      // console.log('[D]' + progress + '%');
      this.setState({uploadProgress: progress})
    }
  }

  hanndleAddClick (e) {
    this.setState({
      mapCenter: this.state.coordinates,
      activePopup: 'edit'
    })
  }

  handleCloseClick (e) {
    this.setState({activePopup: null})
  }

  handleFeatureEnter (e) {
    e.map.getCanvas().style.cursor = 'pointer'
  }

  handleFeatureLeave (e) {
    e.map.getCanvas().style.cursor = 'default'
  }

  handleEditPopupUnmount (e) {
    // Clear edir error status
    this.setState({featureSaveStatus: ''})
  }

  render () {
    let paint = {
      'circle-radius': {
        'base': 1.5,
        'stops': [[12, this.state.circleSize]]
      },
      'circle-color': {
        'property': 'category',
        'type': 'categorical',
        'stops': this.stopsCategories
      },
      'circle-opacity': 0.8
    }

    let features = []
    this.state.places.features.forEach((feature, i) => {
      features.push(
        <Feature
          key={i}
          coordinates={feature.geometry.coordinates}
          properties={feature.properties}
          onMouseEnter={this.handleFeatureEnter}
          onMouseLeave={this.handleFeatureLeave} />
      )
    })

    let popup
    let mbClass = 'mapboxgl-popup mapboxgl-popup-anchor-bottom'
    switch (this.state.activePopup) {
      case 'buttons':
        popup = <Popup
          className={`${mbClass} ${styles.buttonPopup}`}
          anchor='bottom'
          coordinates={this.state.coordinates}>
          <ButtonPopup
            onAddClick={this.hanndleAddClick.bind(this)}
            onCloseClick={this.handleCloseClick.bind(this)} />
        </Popup>
        break
      case 'info':
        popup = <Popup
          className={`${mbClass} ${styles.infoPopup}`}
          anchor='bottom'
          coordinates={this.state.coordinates}>
          <InfoPopup
            title={this.state.featureTitle}
            description={this.state.featureDescription}
            images={this.state.featureImages} />
        </Popup>
        break
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
        </Popup>
        break
      default:
        popup = null;
    }

    let markers = [];
    this.state.markers.forEach((marker, i) => {
      markers.push (
        <Marker
          key={i}
          coordinates={marker.coordinates}
          anchor="bottom">
          <img src={marker.img}/>
        </Marker>
      );
    });    

    return (
      <div id='app-container'>
        <h1 className={styles.mapTitle}>subcity</h1>
        <MapboxGl
          clasName="main-map"
          style="mapbox://styles/mapbox/light-v9"
          center={this.state.mapCenter}
          zoom={this.state.mapZoom}
          onZoomEnd={this.handleZoomEnd.bind(this)}
          onPitchEnd={this.handlePithEnd.bind(this)}
          onDragEnd={this.handleDragEnd.bind(this)}
          containerStyle={{
            height: '100vh',
            width: '100vw'
          }}
          onClick={this.handleMapClick.bind(this)}>
          <Layer
            type="circle"
            id="places"
            paint={paint}>
            {features}
          </Layer>
          {popup}
          {markers}
        </MapboxGl>
      </div>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('root'))
