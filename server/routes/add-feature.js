const fs = require('fs-extra');
const path = require('path');
const md5File = require('md5-file/promise');
const sharp = require('sharp');
const nano = require('../db');


const maxImageCount = 8;
const ext = '.jpg';
const imgResolution = 1280;
const imgQuality = 80;
const maxImageSize = 15000000; // 1.5 MB

const minNameLength = 3;
const maxNameLength = 35;
const minDescriptionLength = 0;
const maxDescriptionLength = 300;

const subcity = nano.use('subcity');



function saveFeature(feature, res) {
  console.log('[D] Saving feature', feature);

  // let featuresJson = 'public/data/places.json';
  // fs.readFile(featuresJson, (err, data) => {
  //   var markerData = JSON.parse(data)
  //
  //   // Construct marker data if empty
  //   if (!markerData.features) {
  //     markerData = {
  //       type: 'FeatureCollection',
  //       features: []
  //     };
  //   }
  //
  //   markerData.features.push(feature);
  //
  //   fs.writeFile(featuresJson, JSON.stringify(markerData, null, 4), (err) => {
  //     if (err) throw err;
  //     res.end(JSON.stringify(feature));
  //   });
  // })
  subcity.insert(feature, (err, body, header) => {
    if (err) {
      console.log('[-] Failed to insert feature to DB.', err.message);
      return;
    }
    console.log('[+] Feature is saved!');
    res.end(JSON.stringify(feature));
  });

}  // End of saveFeature

function rmFile(file) {
  // Remove temp file
  fs.remove(file).then(() => {
    console.log(`${file} removed`);
  }).catch(err => {
    console.error(err)
  })
}

module.exports = (req, res, options) => {

  // Validate form data
  req.assert(
    'name',
    `Name lenght should be ${minNameLength}-${maxNameLength} characters long`
  ).len(minNameLength, maxNameLength);
  req.assert(
    'description',
    `Description lenght should be ${minDescriptionLength}-${maxDescriptionLength} characters long`
  ).len(minDescriptionLength, maxDescriptionLength);
  req.sanitize('name').toString();

  req.getValidationResult().then(result => {
    if (!result.isEmpty()) {
      // There have been validation errors. Send it back
      res.status(400).send(`ERROR: ${result.useFirstErrorOnly().array()[0].msg}`);
      return;
    }

    let body = req.body;
    let files = req.files;
    let date = new Date();

    console.log('[D] Body: ', body);
    console.log('[D] Files: ', files);

    // Create feature
    let feature = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: req.body.coordinates.split(','),
      },
      properties: {
        title: req.body.name,
        description: req.body.description,
        category: req.body.category,
        images: [],
        uid: '123456',  // TODO,
        createdAt: date.toISOString()
      }
    };

    console.log('[+] Adding new feature: ', feature);

    if (files.length > maxImageCount) {
      res.status(500).send(`ERROR: Can not post so many images. Max count is ${maxImageCount}`);
      files.forEach((f) => { rmFile(f.path) });
      return;
    } else if (files.length === 0) {
      saveFeature(feature, res);
    }

    files.forEach((f) => {
      console.log('[D] Processing ', f.originalname);

      // Do file size check first
      if (f.size > maxImageSize) {
        rmFile(f.path);  // Remove temp file
        res.status(500).send(`ERROR: File is to big. Max file is ${maxImageSize/1000000.0} MB`);
        return;
      }

      // TODO(Kirill): Do file security checks and path sanitization here!
      // - max upload size per user

      let fileHash = null;
      md5File(f.path).then(hash => {
        fileHash = hash;
        return sharp(f.path)
          .resize(imgResolution)
          .jpeg({quality: imgQuality})
          .toBuffer()
          .catch(err => {
            throw 'Input file is missing or an unsupported image format';
          });
      }).then(data => {
        return fs.outputFile(`public/uploads/${fileHash}${ext}`, data);
      }).then(() => {

        console.log(`File ${fileHash}${ext} created`);

        rmFile(f.path);

        let newImg = {
          name: fileHash,
          originalname: f.originalname,
          url: `uploads/${fileHash}${ext}`
        };
        feature.properties.images.push(newImg);
        if (feature.properties.images.length === files.length) {
          // All images proccesed
          saveFeature(feature, res);
        }
      }).catch(err => {
        // Remove temp file
        rmFile(f.path);
        console.log(err);
        res.status(500).send(`ERROR: ${err}`);
      });

    }); // End of for each file
  });
} // End of addFeature
