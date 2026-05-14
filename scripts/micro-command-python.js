const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

function toPosixPath(value) {
    return value.split(path.sep).join("/");
}

const rootDirectory = path.resolve(__dirname, "..");
const sourceFilePath = path.join(
    rootDirectory,
    "src",
    "server",
    "handlers",
    "microCommand",
    "MicroCommand.ts",
);
const outputFilePath = path.join(rootDirectory, "dist", "micro_command.py");
const sourceRelativePath = toPosixPath(path.relative(rootDirectory, sourceFilePath));
const outputRelativePath = toPosixPath(path.relative(rootDirectory, outputFilePath));
const generatorRelativePath = toPosixPath(path.relative(rootDirectory, __filename));

const sourceText = fs.readFileSync(sourceFilePath, "utf8");
const sourceFile = ts.createSourceFile(sourceFilePath, sourceText, ts.ScriptTarget.Latest, true);

const exportedDeclarations = [];
const typeAliasMap = new Map();
const renderedTypeAliases = new Map();
const emittedBlocks = [];
const emittedNames = new Set();

function renderLiteralValue(literalNode) {
    if (ts.isStringLiteral(literalNode)) {
        return JSON.stringify(literalNode.text);
    }

    if (ts.isNumericLiteral(literalNode)) {
        return literalNode.text;
    }

    if (literalNode.kind === ts.SyntaxKind.TrueKeyword) {
        return "True";
    }

    if (literalNode.kind === ts.SyntaxKind.FalseKeyword) {
        return "False";
    }

    if (literalNode.kind === ts.SyntaxKind.NullKeyword) {
        return "None";
    }

    return literalNode.getText(sourceFile);
}

function renderEnumMemberValue(initializer) {
    if (ts.isStringLiteral(initializer)) {
        return JSON.stringify(initializer.text);
    }

    if (ts.isNumericLiteral(initializer)) {
        return initializer.text;
    }

    return initializer.getText(sourceFile);
}

function getPropertyName(nameNode) {
    if (
        ts.isIdentifier(nameNode) ||
        ts.isStringLiteral(nameNode) ||
        ts.isNumericLiteral(nameNode)
    ) {
        return nameNode.text;
    }

    return nameNode.getText(sourceFile);
}

function ensureUniqueName(baseName) {
    let candidate = baseName;
    let index = 2;
    while (emittedNames.has(candidate)) {
        candidate = `${baseName}${index}`;
        index += 1;
    }

    return candidate;
}

function hasExportModifier(node) {
    return (node.modifiers ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
}

function toPascalCase(value) {
    return value
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
        .replace(/^[a-z]/, (char) => char.toUpperCase());
}

function dedupe(values) {
    return [...new Set(values)];
}

function renderTsDocComment(comment) {
    if (!comment) {
        return [];
    }

    if (typeof comment === "string") {
        return comment.split(/\r?\n/);
    }

    return comment
        .map((part) => part.text)
        .join("")
        .split(/\r?\n/);
}

function getTsDocCommentLines(node) {
    if (!node) {
        return [];
    }

    return (node.jsDoc ?? []).flatMap((doc) => renderTsDocComment(doc.comment));
}

function escapePythonDocstringText(value) {
    return value.replaceAll('"""', '\\"\\"\\"');
}

function renderPythonDocstringLines(lines, indent = "") {
    if (lines.length === 0) {
        return [];
    }

    if (lines.length === 1) {
        return [`${indent}"""${escapePythonDocstringText(lines[0])}"""`];
    }

    return [
        `${indent}"""`,
        ...lines.map((line) => `${indent}${escapePythonDocstringText(line)}`),
        `${indent}"""`,
    ];
}

function renderUnionType(typeNode, context) {
    const renderedParts = [];
    const literalValues = [];
    let canUseLiteral = true;

    for (const part of typeNode.types) {
        if (ts.isLiteralTypeNode(part)) {
            literalValues.push(renderLiteralValue(part.literal));
            continue;
        }

        if (
            part.kind === ts.SyntaxKind.NullKeyword ||
            part.kind === ts.SyntaxKind.UndefinedKeyword
        ) {
            literalValues.push("None");
            continue;
        }

        canUseLiteral = false;
        renderedParts.push(renderTypeNode(part, context));
    }

    if (canUseLiteral) {
        return `Literal[${dedupe(literalValues).join(", ")}]`;
    }

    renderedParts.push(...literalValues);
    return dedupe(renderedParts).join(" | ");
}

function renderTypeNode(typeNode, context) {
    if (ts.isParenthesizedTypeNode(typeNode)) {
        return renderTypeNode(typeNode.type, context);
    }

    if (ts.isLiteralTypeNode(typeNode)) {
        return `Literal[${renderLiteralValue(typeNode.literal)}]`;
    }

    if (ts.isTypeLiteralNode(typeNode)) {
        return ensureInlineTypedDict(typeNode, context.parentName);
    }

    if (ts.isArrayTypeNode(typeNode)) {
        return `list[${renderTypeNode(typeNode.elementType, context)}]`;
    }

    if (ts.isUnionTypeNode(typeNode)) {
        return renderUnionType(typeNode, context);
    }

    if (ts.isIntersectionTypeNode(typeNode)) {
        return typeNode.types.map((child) => renderTypeNode(child, context)).join(" & ");
    }

    if (ts.isTypeReferenceNode(typeNode)) {
        const typeName = typeNode.typeName.getText(sourceFile);
        if (typeName === "Array" || typeName === "ReadonlyArray") {
            const elementType = typeNode.typeArguments?.[0]
                ? renderTypeNode(typeNode.typeArguments[0], context)
                : "Any";
            return `list[${elementType}]`;
        }

        if (!typeNode.typeArguments || typeNode.typeArguments.length === 0) {
            if (typeName.includes(".")) {
                return `Literal[${typeName}]`;
            }

            return context.inlineTypeAliases && renderedTypeAliases.has(typeName)
                ? renderedTypeAliases.get(typeName)
                : typeName;
        }

        const renderedArguments = typeNode.typeArguments
            .map((argument) => renderTypeNode(argument, context))
            .join(", ");
        return `${typeName}[${renderedArguments}]`;
    }

    switch (typeNode.kind) {
        case ts.SyntaxKind.StringKeyword:
            return "str";
        case ts.SyntaxKind.NumberKeyword:
            return "float";
        case ts.SyntaxKind.BooleanKeyword:
            return "bool";
        case ts.SyntaxKind.AnyKeyword:
        case ts.SyntaxKind.UnknownKeyword:
            return "Any";
        case ts.SyntaxKind.VoidKeyword:
        case ts.SyntaxKind.UndefinedKeyword:
        case ts.SyntaxKind.NullKeyword:
            return "None";
        default:
            return "Any";
    }
}

function renderPropertySignatures(parentName, members) {
    return members.filter(ts.isPropertySignature).flatMap((member) => {
        if (!member.type || !member.name) {
            return [];
        }

        const propertyName = getPropertyName(member.name);
        const propertyType = renderTypeNode(member.type, {
            parentName: `${parentName}${toPascalCase(propertyName)}`,
            inlineTypeAliases: true,
        });
        const renderedType = member.questionToken ? `NotRequired[${propertyType}]` : propertyType;
        return [
            `    ${propertyName}: ${renderedType}`,
            ...renderPythonDocstringLines(getTsDocCommentLines(member), "    "),
        ];
    });
}

function emitTypedDict(name, members, baseNames, sourceNode) {
    const lines = [`class ${name}(${baseNames.join(", ")}):`];
    const docstringLines = renderPythonDocstringLines(getTsDocCommentLines(sourceNode), "    ");
    const propertyLines = renderPropertySignatures(name, members);

    lines.push(
        ...docstringLines,
        ...(propertyLines.length > 0
            ? propertyLines
            : docstringLines.length > 0
              ? []
              : ["    pass"]),
    );
    emittedNames.add(name);
    emittedBlocks.push(lines.join("\n"));
}

function ensureInlineTypedDict(typeLiteralNode, suggestedName) {
    const name = ensureUniqueName(suggestedName);
    if (emittedNames.has(name)) {
        return name;
    }

    emitTypedDict(name, typeLiteralNode.members, ["TypedDict"], typeLiteralNode);
    return name;
}

function resolveUnionMembers(typeNode) {
    if (ts.isParenthesizedTypeNode(typeNode)) {
        return resolveUnionMembers(typeNode.type);
    }

    if (ts.isUnionTypeNode(typeNode)) {
        return typeNode.types.flatMap((child) => resolveUnionMembers(child));
    }

    if (ts.isTypeReferenceNode(typeNode) && ts.isIdentifier(typeNode.typeName)) {
        const aliasName = typeNode.typeName.text;
        const aliasDeclaration = typeAliasMap.get(aliasName);
        if (aliasDeclaration) {
            return resolveUnionMembers(aliasDeclaration.type);
        }

        return [aliasName];
    }

    return [];
}

function getIntersectionAliasSuffix(declarationName, typeNode) {
    if (ts.isParenthesizedTypeNode(typeNode)) {
        return getIntersectionAliasSuffix(declarationName, typeNode.type);
    }

    if (ts.isTypeReferenceNode(typeNode) && ts.isIdentifier(typeNode.typeName)) {
        const baseName = typeNode.typeName.text;
        if (declarationName.startsWith(baseName) && declarationName.length > baseName.length) {
            return declarationName.slice(baseName.length);
        }
    }

    return declarationName;
}

function tryEmitExpandedIntersectionAlias(declaration) {
    if (!ts.isIntersectionTypeNode(declaration.type)) {
        return false;
    }

    const typeNodes = [...declaration.type.types];
    const literalNode = typeNodes.find(ts.isTypeLiteralNode);
    const otherNode = typeNodes.find((node) => node !== literalNode);
    if (!literalNode || !otherNode) {
        return false;
    }

    const members = resolveUnionMembers(otherNode);
    if (members.length === 0) {
        return false;
    }

    const fieldsName = ensureInlineTypedDict(literalNode, `${declaration.name.text}Fields`);
    const expandedNameSuffix = getIntersectionAliasSuffix(declaration.name.text, otherNode);
    const expandedNames = [];

    for (const memberName of members) {
        const expandedName = ensureUniqueName(`${memberName}${expandedNameSuffix}`);
        emittedBlocks.push(`class ${expandedName}(${memberName}, ${fieldsName}):\n    pass`);
        emittedNames.add(expandedName);
        expandedNames.push(expandedName);
    }

    const renderedType = expandedNames.join(" | ");
    renderedTypeAliases.set(declaration.name.text, renderedType);
    emittedBlocks.push(
        [
            `${declaration.name.text}: TypeAlias = ${renderedType}`,
            ...renderPythonDocstringLines(getTsDocCommentLines(declaration)),
        ].join("\n"),
    );
    return true;
}

function getInterfaceBaseNames(declaration) {
    const baseNames = [];
    for (const clause of declaration.heritageClauses ?? []) {
        if (clause.token !== ts.SyntaxKind.ExtendsKeyword) {
            continue;
        }

        baseNames.push(...clause.types.map((type) => type.expression.getText(sourceFile)));
    }

    return baseNames.length > 0 ? baseNames : ["TypedDict"];
}

function emitEnumDeclaration(declaration) {
    const name = declaration.name.text;
    if (emittedNames.has(name)) {
        return;
    }

    const lines = [`class ${name}(str, Enum):`];
    lines.push(...renderPythonDocstringLines(getTsDocCommentLines(declaration), "    "));
    for (const member of declaration.members) {
        const memberName = member.name.getText(sourceFile);
        const memberValue = member.initializer
            ? renderEnumMemberValue(member.initializer)
            : JSON.stringify(memberName);
        lines.push(`    ${memberName} = ${memberValue}`);
    }

    emittedNames.add(name);
    emittedBlocks.push(lines.join("\n"));
}

function emitInterfaceDeclaration(declaration) {
    const name = declaration.name.text;
    if (emittedNames.has(name)) {
        return;
    }

    emitTypedDict(name, declaration.members, getInterfaceBaseNames(declaration), declaration);
}

function emitTypeAliasDeclaration(declaration) {
    const name = declaration.name.text;
    if (emittedNames.has(name)) {
        return;
    }

    if (tryEmitExpandedIntersectionAlias(declaration)) {
        emittedNames.add(name);
        return;
    }

    const renderedType = renderTypeNode(declaration.type, { parentName: name });
    emittedNames.add(name);
    renderedTypeAliases.set(name, renderedType);
    emittedBlocks.push(
        [
            `${name}: TypeAlias = ${renderedType}`,
            ...renderPythonDocstringLines(getTsDocCommentLines(declaration)),
        ].join("\n"),
    );
}

function emitDeclaration(declaration) {
    if (ts.isEnumDeclaration(declaration)) {
        emitEnumDeclaration(declaration);
        return;
    }

    if (ts.isInterfaceDeclaration(declaration)) {
        emitInterfaceDeclaration(declaration);
        return;
    }

    if (ts.isTypeAliasDeclaration(declaration)) {
        emitTypeAliasDeclaration(declaration);
    }
}

for (const statement of sourceFile.statements) {
    if (!hasExportModifier(statement)) {
        continue;
    }

    if (
        ts.isEnumDeclaration(statement) ||
        ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement)
    ) {
        exportedDeclarations.push(statement);
    }

    if (ts.isTypeAliasDeclaration(statement)) {
        typeAliasMap.set(statement.name.text, statement);
    }
}

for (const declaration of exportedDeclarations) {
    emitDeclaration(declaration);
}

const outputLines = [
    `# This file is generated by ${generatorRelativePath} from ${sourceRelativePath}.`,
    "# Do not edit this file directly; update the TypeScript source and regenerate it.",
    "from __future__ import annotations",
    "",
    "from enum import Enum",
    "from typing import Any, Literal, NotRequired, TypeAlias, TypedDict",
    "",
    emittedBlocks.join("\n\n"),
    "",
];

fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
fs.writeFileSync(outputFilePath, outputLines.join("\n"), "utf8");

console.log(`Wrote ${outputRelativePath}`);
