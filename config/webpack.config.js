const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

const devCerts = require("office-addin-dev-certs");

const { Compilation, sources } = require("webpack");

class CreateFilesPlugin {
    /**
     * @type {() => Promise<[string, string][]>}
     */
    createFiles = undefined;

    /**
     * @type {[string, string][]}
     */
    cached = undefined;

    /**
     * @param {() => Promise<[string, string][]>} createFiles
     */
    constructor(createFiles) {
        this.createFiles = createFiles;
    }

    apply(compiler) {
        const pluginName = "EmitFilesPlugin";

        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
            compilation.hooks.processAssets.tapPromise(
                {
                    name: pluginName,
                    stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
                },
                async () => {
                    try {
                        // Don't regenerate each time
                        if (this.cached === undefined) {
                            this.cached = await this.createFiles();
                        }
                        const nameAndContent = this.cached;

                        // Loop through and emit each asset
                        nameAndContent.forEach(([filename, content]) => {
                            if (content) {
                                const outputPath = path.join("certs", filename);
                                compilation.emitAsset(outputPath, new sources.RawSource(content));
                            }
                        });
                    } catch (error) {
                        compilation.errors.push(
                            new Error(`Failed to emit dev certs: ${error.message}`),
                        );
                    }
                },
            );
        });
    }
}

module.exports = async (env, options) => {
    const isDevelopment = options.mode === "development";

    const outputPath = path.resolve(__dirname, "..", "dist");

    const cleanConfig = {
        output: {
            path: outputPath,
        },
        plugins: [new CleanWebpackPlugin()],
    };

    const serverConfig = {
        target: "node",
        devtool: isDevelopment ? "inline-source-map" : undefined,
        performance: { hints: false },
        entry: { index: "./src/index.ts" },
        output: {
            filename: "[name].bundle.js",
            path: outputPath,
        },
        resolve: { extensions: [".ts", ".json", ".js"] },
        module: {
            rules: [{ test: /\.(ts|tsx)$/, loader: "ts-loader" }],
        },
        watch: isDevelopment,
        plugins: [
            new CreateFilesPlugin(async () => {
                const { ca, key, cert } = await devCerts.getHttpsServerOptions();

                // Mapping the options keys to desired filenames
                return [
                    ["ca.pem", ca],
                    ["key.pem", key],
                    ["cert.pem", cert],
                ];
            }),
        ],
    };

    const addinConfig = {
        target: "web",
        devtool: isDevelopment ? "inline-source-map" : undefined,
        performance: { hints: false },
        entry: { addin: "./addin/index.ts" },
        output: {
            filename: "[name].bundle.js",
            path: outputPath,
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
                            <h1>Sideload</h1>
                            </body>
                        </html>`;
                },
            }),
        ],
        watch: isDevelopment,
    };

    return [cleanConfig, addinConfig, serverConfig];
};
