const express = require('express');
const multer  = require('multer');
const bodyParser = require('body-parser');
const validator = require('express-validator');
const addFeature = require('./routes/add-feature');
const getFeatures = require('./routes/get-features');


const app = express();
const storage = multer.memoryStorage()
// const upload = multer({ storage })
var upload = multer({ dest: 'tmp/' });

const port = 8082;
const art = `
____ _  _ ___  _  _ ____ ___
==== |__| |==] |\/| |--| |--'
`
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(validator()); // this line must be immediately after any of the bodyParser middlewares!

app.use(express.static('public'));
app.use(express.static('public/dist'));
app.use(express.static('public/html'));

app.listen(port, () => {
  console.log(art);
  console.log(`Listening on port ${port}`);
});

// Handle adding feature to the map
app.post('/addfeature', upload.array('images'), addFeature);

// Get features from database and send it to client
app.get('/getfeatures', getFeatures);
