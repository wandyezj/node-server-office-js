import AdmZip from "adm-zip";
import { DOMParser, XMLSerializer, type Element } from "@xmldom/xmldom";
import { removePrefix } from "./removePrefix";
import path from "node:path";
import { writeManifestToRegistry } from "./writeManifestToRegistry";

const pathContentWebExtension = {
    path: "xl/webextensions/webextension1.xml",
    content: `
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<we:webextension xmlns:we="http://schemas.microsoft.com/office/webextensions/webextension/2010/11" id="{{980ED15C-DB60-4116-B78A-74CA083A353B}}">
<we:reference id="{guid}" version="1.0.0.0" store="developer" storeType="Registry"/>
<we:alternateReferences/>
<we:properties>
    <we:property name="Office.AutoShowTaskpaneWithDocument" value="true"/>
</we:properties>
<we:bindings/>
<we:snapshot xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
</we:webextension>
`.trim(),
};

const pathContentTaskpanes = {
    path: "xl/webextensions/taskpanes.xml",
    content: `
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>    
<wetp:taskpanes xmlns:wetp="http://schemas.microsoft.com/office/webextensions/taskpanes/2010/11">
<wetp:taskpane dockstate="right" visibility="1" width="350" row="8">
<wetp:webextensionref r:id="rId1" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" />
</wetp:taskpane>
</wetp:taskpanes>
`.trim(),
};

const pathContentTaskpanesRels = {
    path: "xl/webextensions/_rels/taskpanes.xml.rels",
    content: `
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.microsoft.com/office/2011/relationships/webextension" Target="webextension1.xml" />
</Relationships>
`.trim(),
};

const pathContent = {
    webExtension: pathContentWebExtension,
    taskpanes: pathContentTaskpanes,
    taskpanesRels: pathContentTaskpanesRels,
};

const pathAdditions = [pathContent.webExtension, pathContent.taskpanes, pathContent.taskpanesRels];

/**
 * Update [Content_Types].xml
 * Insert before 'docProps/core.xml' if exists, otherwise append at the end
 * @param zip
 * @returns
 */
function updateContentTypes(zip: AdmZip): void {
    const contentTypesEntry = zip.getEntry("[Content_Types].xml");
    if (!contentTypesEntry) {
        return;
    }

    const overrides: { partName: string; contentType: string }[] = [
        {
            partName: "/xl/webextensions/taskpanes.xml",
            contentType: "application/vnd.ms-office.webextensiontaskpanes+xml",
        },
        {
            partName: "/xl/webextensions/webextension1.xml",
            contentType: "application/vnd.ms-office.webextension+xml",
        },
    ];

    const data = contentTypesEntry.getData().toString("utf-8");

    const parser = new DOMParser();
    const xml = parser.parseFromString(data, "application/xml");

    const root = xml.documentElement;
    if (!root) {
        throw new Error("Invalid [Content_Types].xml: Missing root element");
    }

    const currentOverrides = root.getElementsByTagName("Override");
    function getElementWithPartName(partName: string): Element | null {
        const elements = currentOverrides;
        for (let i = 0; i < elements.length; i++) {
            if (elements[i].getAttribute("PartName") === partName) {
                return elements[i];
            }
        }
        return null;
    }

    const coreElement = getElementWithPartName("/docProps/core.xml");

    for (const { partName, contentType } of overrides) {
        const element = getElementWithPartName(partName);

        if (!element) {
            const el = xml.createElement("Override");
            el.setAttribute("PartName", partName);
            el.setAttribute("ContentType", contentType);
            if (coreElement) {
                root.insertBefore(el, coreElement);
            } else {
                root.appendChild(el);
            }
        }
    }

    const serializer = new XMLSerializer();
    const updatedXml = serializer.serializeToString(xml);
    zip.updateFile(contentTypesEntry.entryName, Buffer.from(updatedXml, "utf-8"));
}

function updateRootRels(zip: AdmZip): void {
    const relsEntry = zip.getEntry("_rels/.rels");
    if (!relsEntry) {
        return;
    }

    const data = relsEntry.getData().toString("utf-8");

    const parser = new DOMParser();
    const xml = parser.parseFromString(data, "application/xml");

    const root = xml.documentElement;
    if (!root) {
        throw new Error("Invalid .rels: Missing root element");
    }

    const relationships = root.getElementsByTagName("Relationship");

    const rIds = [];
    for (let i = 0; i < relationships.length; i++) {
        const id = relationships[i].getAttribute("Id");
        if (!id) {
            continue;
        }

        const prefix = "rId";
        const idNumber = parseInt(removePrefix(id, prefix), 10);
        rIds.push(idNumber);
    }

    let nextRid = 0;
    for (let i = 1; i <= rIds.length + 2; i++) {
        if (!rIds.includes(i)) {
            nextRid = i;
            break;
        }
    }
    const nextRidStr = `rId${nextRid}`;

    const element = xml.createElement("Relationship");
    element.setAttribute("Id", nextRidStr);
    element.setAttribute(
        "Type",
        "http://schemas.microsoft.com/office/2011/relationships/webextensiontaskpanes",
    );
    element.setAttribute("Target", "xl/webextensions/taskpanes.xml");
    root.appendChild(element);

    const serializer = new XMLSerializer();
    const updatedXml = serializer.serializeToString(xml);
    zip.updateFile(relsEntry.entryName, Buffer.from(updatedXml, "utf-8"));
}

export function addWebExtension(filePathIn: string, filePathOut: string): void {
    const zip = new AdmZip(filePathIn);

    const manifestGuid = "73570000-0000-0000-0000-000000000000";
    const manifestPath = path.normalize(path.join(__dirname, "manifest.xml"));
    writeManifestToRegistry(manifestGuid, manifestPath);

    const hasWebExtension = null !== zip.getEntry(pathContent.webExtension.path);

    // Is this needed?
    if (!hasWebExtension) {
        updateContentTypes(zip);
        updateRootRels(zip);
    }

    // Completely replace the entries.
    for (const item of pathAdditions) {
        zip.deleteFile(item.path);
        zip.addFile(item.path, Buffer.from(item.content));
    }

    zip.writeZip(filePathOut);
}

export function removeWebExtension(filePathIn: string, filePathOut: string): void {
    const zip = new AdmZip(filePathIn);

    for (const item of pathAdditions) {
        zip.deleteFile(item.path);
    }

    zip.writeZip(filePathOut);
}
