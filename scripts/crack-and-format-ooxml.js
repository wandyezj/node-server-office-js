// This script takes in an excel file path, cracks it open, extracts all the files in it,
// and then formats all of the xml files.

const fs = require("node:fs");
const path = require("node:path");
const { parseArgs } = require("node:util");

const AdmZip = require("adm-zip");
const prettier = require("prettier");

const prettierConfig = require("../config/prettier.json");

async function formatXml(xml) {
    const trimmedXml = xml.trim();
    if (!trimmedXml) {
        return xml;
    }

    return prettier.format(trimmedXml, {
        ...prettierConfig,
        parser: "xml",
        plugins: ["@prettier/plugin-xml"],
        xmlWhitespaceSensitivity: "ignore",
    });
}

function isXmlFile(entryName) {
    const lowerEntryName = entryName.toLowerCase();
    return lowerEntryName.endsWith(".xml") || lowerEntryName.endsWith(".rels");
}

async function writeEntry(outputDirectory, entry) {
    const entryPath = entry.entryName.split("/").join(path.sep);
    const targetPath = path.resolve(outputDirectory, entryPath);

    assertSafeOutputPath(outputDirectory, targetPath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });

    if (entry.isDirectory) {
        fs.mkdirSync(targetPath, { recursive: true });
        return { formatted: false };
    }

    const entryData = entry.getData();

    if (!isXmlFile(entry.entryName)) {
        fs.writeFileSync(targetPath, entryData);
        return { formatted: false };
    }

    const xml = entryData.toString("utf8");
    const formattedXml = await formatXml(xml);
    fs.writeFileSync(targetPath, formattedXml, "utf8");
    return { formatted: true };
}

function assertFileExists(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
        throw new Error(`Expected a file path: ${filePath}`);
    }
}

function assertSafeOutputPath(outputDirectory, targetPath) {
    const relativePath = path.relative(outputDirectory, targetPath);
    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
        throw new Error(`Refusing to write outside output directory: ${targetPath}`);
    }
}

async function main() {
    const { values } = parseArgs({
        args: process.argv.slice(2),
        options: {
            "input-file-path": {
                type: "string",
            },
            "output-directory": {
                type: "string",
            },
            help: {
                type: "boolean",
                short: "h",
            },
        },
    });

    const inputPath = values["input-file-path"];
    const outputPath = values["output-directory"];

    if (values.help || !inputPath || !outputPath) {
        console.log(
            "usage: node scripts/crack-and-format-ooxml.js --input-file-path [input file path] --output-directory [output directory]",
        );
        process.exit(values.help ? 0 : 1);
    }

    const excelFilePath = path.resolve(inputPath);
    assertFileExists(excelFilePath);

    // Name the output directory the same as the file name
    const outputDirectoryName = path.basename(excelFilePath);
    const outputDirectory = path.resolve(path.join(outputPath, outputDirectoryName));

    console.log(`In: ${excelFilePath}`);
    console.log(`Out: ${outputDirectory}`);

    if (fs.existsSync(outputDirectory)) {
        fs.rmSync(outputDirectory, { recursive: true, force: true });
    }

    fs.mkdirSync(outputDirectory, { recursive: true });

    const zip = new AdmZip(excelFilePath);

    for (const entry of zip.getEntries()) {
        await writeEntry(outputDirectory, entry);
    }
}

main();

