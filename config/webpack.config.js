const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

module.exports = async (env, options) => {
    const isDevelopment = options.mode === "development";

    const cleanConfig = {
        plugins: [new CleanWebpackPlugin()],
    };

    const serverConfig = {
        target: "node",
        devtool: isDevelopment ? "inline-source-map" : undefined,
        performance: { hints: false },
        entry: { index: "./src/index.ts" },
        output: {
            filename: "[name].bundle.js",
            path: path.resolve(__dirname, "..", "dist"),
        },
        resolve: { extensions: [".ts", ".json", ".js"] },
        module: {
            rules: [{ test: /\.(ts|tsx)$/, loader: "ts-loader" }],
        },
        watch: isDevelopment,
    };

    const addinConfig = {
        target: "web",
        devtool: isDevelopment ? "inline-source-map" : undefined,
        performance: { hints: false },
        entry: { addin: "./addin/index.ts" },
        output: {
            filename: "[name].bundle.js",
            path: path.resolve(__dirname, "..", "dist"),
        },
        resolve: { extensions: [".ts", ".json", ".js"] },
        module: {
            rules: [{ test: /\.(ts|tsx)$/, loader: "ts-loader" }],
        },
        plugins: [
            new HtmlWebpackPlugin({
                filename: "taskpane.html",
                chunks: ["addin"],
                inject: false,
                templateContent: ({ htmlWebpackPlugin, compilation }) => {
                    const scripts = htmlWebpackPlugin.files.js
                        .map((jsPath) => {
                            const assetName = jsPath.replace(/^\//, "");
                            const source = compilation.assets[assetName]?.source() ?? "";
                            return `<script>${source}</script>`;
                        })
                        .join("\n    ");
                    return `<!DOCTYPE html>\n<html>\n<head>\n    <title>Addin</title>\n    ${scripts}\n</head>\n<body></body>\n</html>`;
                },
            }),
        ],
        watch: isDevelopment,
    };

    return [addinConfig, serverConfig];
};
