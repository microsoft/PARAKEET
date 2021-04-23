"use strict"
{
  // Required to form a complete output path
  let path = require('path');

  // Plugin for cleaning up the output folder (bundle) before creating a new one
  const { CleanWebpackPlugin } = require('clean-webpack-plugin');

  // Path to the output folder
  const bundleFolder = "Release/";

  let config = {
    // Application entry point
    entry: "./parakeet.polyfill.ts",
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: "ts-loader",
          exclude: /node_modules/,
        },
      ]
    },
    resolve: {
      extensions: [".tsx", ".d.ts", ".ts", ".js"]
    },
    // Include the generation of debugging information within the output file
    // (Required for debugging client scripts)
    devtool: "inline-source-map"
  };

  let minConfig = Object.assign({}, config, {
    name: "MinifiedConfig",
    mode: "production",
    output: {
      filename: 'parakeet.js',
      path: path.resolve(__dirname, bundleFolder)+"/dbg"
    },
    plugins: [
      new CleanWebpackPlugin()
    ],
    optimization: {
      minimize: false
    }
  });

  let debugConfig = Object.assign({}, config, {
    name: "DebugConfig",
    mode: "development",
    output: {
      filename: 'parakeet.min.js',
      path: path.resolve(__dirname, bundleFolder) +"/min"
    },
    plugins: [
      new CleanWebpackPlugin()
    ],
    optimization: {
      minimize: true
    }
  });

  module.exports = [debugConfig, minConfig ];
}
