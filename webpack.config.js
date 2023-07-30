const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TypedocWebpackPlugin = require('typedoc-webpack-plugin');

module.exports = {
    entry: './src/index.ts',
    mode: process.env.NODE_ENV === "production" ? "production" : "development",
    devtool: "source-map",
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true, // Clean the dist folder before each build
        publicPath: '/', // Specifies the public URL of the output directory when referenced in a browser
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'static'), // Tells the server where to serve content from
        },
        devMiddleware: {
            publicPath: '/', // The public path that the middleware serves, necessary for HMR
        },
        hot: true, // Enable webpack's Hot Module Replacement feature
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        sourceMaps: true
                    }
                },
            },
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: 'ts-loader',
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: 'assets', to: 'assets' },
                { from: 'static', to: '' }
            ]
        })
    ]
};