import * as fs from "node:fs";
import AdmZip from "adm-zip";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { writeManifestToRegistry } from "./writeManifestToRegistry";

/**
 * Sideloads an Office.js Add-in into an Excel file.
 * @param {string} excelPath - Path to the source .xlsx file
 * @param {string} manifestPath - Path to the Add-in Manifest XML
 * @param {string} outputPath - Path where the modified .xlsx will be saved
 */
export function embedAddIn(excelPath: string, manifestPath: string, outputPath: string) {
    const zip = new AdmZip(excelPath);
    const serializer = new XMLSerializer();
    const parser = new DOMParser();

    // 1. Extract the Add-in ID and Version from the manifest
    const manifestContent = fs.readFileSync(manifestPath, "utf-8");
    const manifestDoc = parser.parseFromString(manifestContent, "text/xml");
    const addInId = manifestDoc.getElementsByTagName("Id")[0]?.textContent;
    const version = manifestDoc.getElementsByTagName("Version")[0]?.textContent || "1.0.0.0";

    if (!addInId) throw new Error("Could not find ID in manifest.");

    writeManifestToRegistry(addInId, manifestPath);

    // 2. Create xl/webextensions/webextension1.xml
    const webExtXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<we:webextension xmlns:we="http://schemas.microsoft.com/office/webextensions/webextension/2010/11" id="{${addInId}}">
  <we:reference id="{${addInId}}" version="${version}" store="developer" storeType="Registry"/>
  <we:alternateReferences/>
  <we:properties>
    <we:property name="Office.AutoShowTaskpaneWithDocument" value="true"/>
  </we:properties>
  <we:bindings/><we:snapshot xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
</we:webextension>`;
    zip.addFile("xl/webextensions/webextension1.xml", Buffer.from(webExtXml));

    // 3. Create xl/webextensions/taskpanes.xml
    const taskpanesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<wetp:taskpanes xmlns:wetp="http://schemas.microsoft.com/office/webextensions/taskpanes/2010/11">
  <wetp:taskpane dockstate="right" visibility="1" width="350" row="1">
    <wetp:webextensionref xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId1"/>
  </wetp:taskpane>
</wetp:taskpanes>`;
    zip.addFile("xl/webextensions/taskpanes.xml", Buffer.from(taskpanesXml));

    // 4. Create xl/webextensions/_rels/taskpanes.xml.rels
    const taskpaneRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.microsoft.com/office/2011/relationships/webextension" Target="webextension1.xml"/>
</Relationships>`;
    zip.addFile("xl/webextensions/_rels/taskpanes.xml.rels", Buffer.from(taskpaneRelsXml));

    // 5. Update _rels/.rels (package-level rels)
    const rootRelsPath = "_rels/.rels";
    const rootRelsDoc = parser.parseFromString(zip.readAsText(rootRelsPath), "text/xml");
    const relsRoot = rootRelsDoc.getElementsByTagName("Relationships")[0];

    // Check if relationship already exists to avoid duplicates
    const existingRels = Array.from(rootRelsDoc.getElementsByTagName("Relationship"));
    const hasRel = existingRels.some(
        (r) => r.getAttribute("Target") === "xl/webextensions/taskpanes.xml",
    );

    if (!hasRel) {
        const newRel = rootRelsDoc.createElement("Relationship");
        const newId = `rIdWebExt${Math.floor(Math.random() * 10000)}`; // Simple unique ID
        newRel.setAttribute("Id", newId);
        newRel.setAttribute(
            "Type",
            "http://schemas.microsoft.com/office/2011/relationships/webextensiontaskpanes",
        );
        newRel.setAttribute("Target", "xl/webextensions/taskpanes.xml");
        relsRoot.appendChild(newRel);
        zip.updateFile(rootRelsPath, Buffer.from(serializer.serializeToString(rootRelsDoc)));
    }

    // 6. Update [Content_Types].xml
    const contentTypesPath = "[Content_Types].xml";
    const contentTypesDoc = parser.parseFromString(zip.readAsText(contentTypesPath), "text/xml");
    const typesRoot = contentTypesDoc.getElementsByTagName("Types")[0];

    const overrides = [
        {
            PartName: "/xl/webextensions/webextension1.xml",
            ContentType: "application/vnd.ms-office.webextension+xml",
        },
        {
            PartName: "/xl/webextensions/taskpanes.xml",
            ContentType: "application/vnd.ms-office.webextensiontaskpanes+xml",
        },
    ];

    overrides.forEach((ov) => {
        const existing = Array.from(contentTypesDoc.getElementsByTagName("Override")).find(
            (el) => el.getAttribute("PartName") === ov.PartName,
        );
        if (!existing) {
            const node = contentTypesDoc.createElement("Override");
            node.setAttribute("PartName", ov.PartName);
            node.setAttribute("ContentType", ov.ContentType);
            typesRoot.appendChild(node);
        }
    });

    zip.updateFile(contentTypesPath, Buffer.from(serializer.serializeToString(contentTypesDoc)));

    // 7. Write the final file
    zip.writeZip(outputPath);
    console.log(`Success! File saved to: ${outputPath}`);
}

// Example usage:
// embedAddIn('./template.xlsx', './manifest.xml', './output_with_addin.xlsx');
