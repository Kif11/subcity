const nano = require('../db');
const subcity = nano.use('subcity');


module.exports = (req, res, options) => {

  subcity.fetch({}, (err, body) => {
    if (err) {
      console.log('[-]', err);
      res.status(500).send(err);
      return;
    }
    let features = [];
    body.rows.forEach(function(row) {
      features.push(row.doc);
    });

    let featureCollection = {
      "type": "FeatureCollection",
      "features": features
    }

    res.status(200).send(featureCollection);
  });

};
