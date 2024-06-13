const {
  exec
} = require('child_process');
const path = require('path');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")

module.exports = (env, options) => {
  const {
    mode = 'development'
  } = options;
  const rules = [
    {
      test: /\.m?js$/,
      use: [
        'html-tag-js/jsx/tag-loader.js',
        {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-transform-runtime']
          },
        },
      ],
    },
    {
      test: /\.(sa|sc|c)ss$/,
      use: ["raw-loader",
        "postcss-loader",
        "sass-loader"],
    },
    {
      test: /\.tpl.html$/,
      use: 'raw-loader'
    }
  ];

  const main = {
    mode,
    entry: {
      main: './src/main.js',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      chunkFilename: '[name].js',
    },
    module: {
      rules,
    },
    plugins: [
      new NodePolyfillPlugin(),
      {
        apply: (compiler) => {
          compiler.hooks.afterDone.tap('pack-zip', () => {
            // run pack-zip.js
            exec('node .vscode/pack-zip.js', (err, stdout, stderr) => {
              if (err) {
                console.error(err);
                return;
              }
              console.log(stdout);
            });
          });
        }
      }],
  };

  return [main];
}