const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const path = require("path");

module.exports = async (env, options) => {
    //console.log(env);

    const isDevelopment = options.mode === "development";
    const config = {
        target: "node",
        // no source maps for production
        devtool: isDevelopment ? "inline-source-map" : undefined,

        // Ignore file size violation hints
        performance: {
            hints: false,
        },
        devServer: {
            static: {
                directory: path.join(__dirname, "..", "dist"),
            },
        },
        entry: {
            index: "./src/index.ts",
        },
        output: {
            filename: "[name].bundle.js",
            path: path.resolve(__dirname, "..", "dist"),
        },
        optimization: {
            runtimeChunk: "single",
            splitChunks: {
                chunks: "all",
            },
        },
        resolve: {
            extensions: [".ts", ".json", ".js"],
        },

        module: {
            rules: [
                {
                    test: /\.(ts|tsx)$/,
                    loader: "ts-loader",
                },
            ],
        },
        plugins: [new CleanWebpackPlugin()],
    };

    // Only need to watch in development mode
    if (options.mode === "development") {
        config.watch = true;
    }

    return config;
};