
const HtmlWebpackPlugin = require('html-webpack-plugin'); //通过 npm 安装
const webpack = require('webpack'); //访问内置的插件
const path = require('path');

var config = {  
    entry: {
        index: './src/app.js',
        vendor: ['web3']
    },  
    output: {  
        path: path.resolve(__dirname, 'dist'),
        filename: "[name].[chunkHash:8].js",
        chunkFilename: "[name].[chunkHash:8].js"
    },  
    module: {  
        loaders: [{  
            test: /\.js$/,  
            exclude: /node_modules/,  
            loader: 'babel-loader'  
        }]  
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin(),
        new HtmlWebpackPlugin({
            template: './src/index.html',
            filename: path.resolve(__dirname, 'dist/index.html'),
        }),
        //分离单独打包web3js
        new webpack.optimize.CommonsChunkPlugin({
            names: 'vendor'
        })
    ]  
}

module.exports = config;