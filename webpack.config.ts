import * as path from 'path'
import { Configuration } from 'webpack'

const config: Configuration = ({
  target: 'node',
  entry: {
    bundle: path.resolve(__dirname, 'src', 'index.ts'),
    script: path.resolve(__dirname, 'src', 'scripts', 'index.ts'),
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.js', '.json', '.ts'],
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
