const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
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
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: path.resolve(__dirname, "..", "addin", "manifest.xml"),
                        to: "manifest.xml",
                    },
                    {
                        from: "*.png",
                        to: "[name][ext]",
                        context: path.resolve(__dirname, "..", "addin"),
                    },
                ],
            }),
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
                    return `<!DOCTYPE html>
                        <html>
                        <head>
                            <title>Addin</title>
                            <script type="text/javascript" src="https://appsforoffice.microsoft.com/lib/beta/hosted/office.js"></script>
                                ${scripts}
                        </head>
                            <body>
                            </body>
                        </html>`;
                },
            }),
        ],
        watch: isDevelopment,
    };

    return [addinConfig, serverConfig];
};
