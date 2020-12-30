const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const autoprefixer = require("autoprefixer");
const packageLockJson = require("./package-lock.json");

const controllerSrcPath = path.resolve(__dirname + "/src");
const escSdkVersion = packageLockJson.dependencies["@esc_games/esc-controller-sdk"].version;
const slug = process.env.NODE_ENV !== 'production' ? require("os").hostname().replace(/\./g, "-") : "esc-trivia-live";
//const slug = "esc-trivia-live";

module.exports = {
    entry: "./src/index.js",
    module: {
        rules: [
            {
                // "oneOf" will traverse all following loaders until one will
                // match the requirements. When no loader matches it will fall
                // back to the "file" loader at the end of the loader list.
                oneOf: [
                    // "url" loader works like "file" loader except that it embeds assets
                    // smaller than specified limit in bytes as data URLs to avoid requests.
                    // A missing `test` is equivalent to a match.
                    {
                        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
                        loader: require.resolve("url-loader"),
                        options: {
                            limit: 10000,
                            name: "static/media/[name].[hash:8].[ext]",
                        },
                    },
                    {
                        test: /\.scss$/,
                        use: [
                            "style-loader", // creates style nodes from JS strings
                            "css-loader", // translates CSS into CommonJS
                            "sass-loader" // compiles Sass to CSS, using Node Sass by default
                        ]
                    },
                    {
                        test: /\.svg$/,
                        use: ["@svgr/webpack"],
                    },
                    // Process JS with Babel.
                    {
                        test: /\.(js|jsx|mjs)$/,
                        include: controllerSrcPath,
                        loader: require.resolve("babel-loader"),
                        options: {
                            "presets": [
                                "@babel/preset-env",
                                "@babel/preset-react",
                            ],
                            "plugins": [
                                "@babel/plugin-syntax-dynamic-import"
                            ],
                            // This is a feature of `babel-loader` for webpack (not Babel itself).
                            // It enables caching results in ./node_modules/.cache/babel-loader/
                            // directory for faster rebuilds.
                            cacheDirectory: true,
                        },
                    },
                    // "postcss" loader applies autoprefixer to our CSS.
                    // "css" loader resolves paths in CSS and adds assets as dependencies.
                    // "style" loader turns CSS into JS modules that inject <style> tags.
                    // In production, we use a plugin to extract that CSS to a file, but
                    // in development "style" loader enables hot editing of CSS.
                    {
                        test: /\.css$/,
                        use: [
                            require.resolve("style-loader"),
                            {
                                loader: require.resolve("css-loader"),
                                options: {
                                    importLoaders: 1,
                                },
                            },
                            {
                                loader: require.resolve("postcss-loader"),
                                options: {
                                    // Necessary for external CSS imports to work
                                    // https://github.com/facebookincubator/create-react-app/issues/2677
                                    ident: "postcss",
                                    plugins: () => [
                                        require("postcss-flexbugs-fixes"),
                                        autoprefixer({
                                            browsers: [
                                                ">1%",
                                                "last 4 versions",
                                                "Firefox ESR",
                                                "not ie < 9", // React doesn"t support IE8 anyway
                                            ],
                                            flexbox: "no-2009",
                                        }),
                                    ],
                                },
                            },
                        ],
                    },
                ]
            }
        ]
    },
    resolve: {
        extensions: ["*", ".js", ".jsx"],
        alias: {
            Common: path.resolve(__dirname + "/../common"),
        },
    },
    output: {
        path: __dirname + "/dist",
        publicPath: "/",
        filename: "bundle.js",
        chunkFilename: "[name].bundle.js",
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname + "/src/index.html"),
            templateParameters: {
                SLUG:slug,
            },
        })
    ],
    devServer: {
        contentBase: path.join(__dirname, "dist"),
        // The next two lines allow server to be accessed beyond localhost
        host: '0.0.0.0',
        disableHostCheck: true,
        hot: true,

		// Allows the url to include slug
        proxy: {
            '/': {
                target: 'http://localhost:8080',
                pathRewrite: {'^/.*' : ''}
            }
        },
    },
    optimization: {
        splitChunks: {
            cacheGroups: {
                // Split ESC images into their own bundle
                escImages: {
                    test: /[\\/]node_modules[\\/]@esc_games\/esc-controller-sdk\/(.*)?\.(png|svg)/,
                    name: () => `esc-controller-sdk-${escSdkVersion}-images`,
                    chunks: "all",
                    priority: 2
                },
                // Split the remaining ESC code into its own bundle, with version
                esc: {
                    test: /[\\/]node_modules[\\/]@esc_games\/esc-controller-sdk/,
                    name: () => `esc-controller-sdk-${escSdkVersion}`,
                    chunks: "all",
                    priority: 1
                },
                // Split the remaining vendors into a vendor bundle
                commons: {
                    test: /[\\/]node_modules[\\/]/,
                    name: "vendors",
                    chunks: "all",
                    priority: 0
                },
            }
        }
    }
};