import * as path from 'path'
import { Configuration } from 'webpack'

const config: Configuration = ({
  target: 'node',
  entry: {
    background: path.resolve(__dirname, 'src', 'index.ts'),
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
})

export default config
