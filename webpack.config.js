const path = require('path');
const webpack = require('webpack');

const DEV = process.env.NODE_ENV === 'development';
const PROD = process.env.NODE_ENV === 'production';

let plugins = PROD
  ? [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify('production')
        }
      }),
      new webpack.optimize.UglifyJsPlugin({
        sourceMap: true,
        compress: {
          warnings: false,
          // don't optimize comparisons
          // this is to prevent mapbox-gl from breaking
          comparisons: false,
        }
      })
    ]
  : []

let css_loaders = PROD
  ? ['style-loader', 'css-loader']
  : ['style-loader', 'css-loader?localIdentName=[path][name]--[local]']

module.exports = {
  entry: './src/index.jsx',
  plugins: plugins,
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public', 'dist')
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  module : {
    loaders : [
      {
        test : /\.jsx?$/,
        loader : 'babel-loader',
        exclude: path.join(__dirname, 'node_modules')
      },
      {
        test : /\.(jpg|png|gif)$/,
        loader : 'url-loader?limit=10000&name=img/[hash:12].[ext]',
        exclude: path.join(__dirname, 'node_modules')
      },
      {
        test : /\.css$/,
        loaders : css_loaders,
        exclude: path.join(__dirname, 'node_modules')
      }
    ]
  }
};
