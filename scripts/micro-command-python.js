const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

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

const sourceText = fs.readFileSync(sourceFilePath, "utf8");
const sourceFile = ts.createSourceFile(sourceFilePath, sourceText, ts.ScriptTarget.Latest, true);

const enumDeclarations = [];
const interfaceDeclarations = [];
const typeAliasDeclarations = [];
const typeAliasMap = new Map();
const emittedBlocks = [];
const emittedNames = new Set();

for (const statement of sourceFile.statements) {
    if (!hasExportModifier(statement)) {
        continue;
    }

    if (ts.isEnumDeclaration(statement)) {
        enumDeclarations.push(statement);
        continue;
    }

    if (ts.isInterfaceDeclaration(statement)) {
        interfaceDeclarations.push(statement);
        continue;
    }

    if (ts.isTypeAliasDeclaration(statement)) {
        typeAliasDeclarations.push(statement);
        typeAliasMap.set(statement.name.text, statement);
    }
}

for (const declaration of enumDeclarations) {
    emitEnumDeclaration(declaration);
}

for (const declaration of interfaceDeclarations) {
    emitInterfaceDeclaration(declaration);
}

for (const declaration of typeAliasDeclarations) {
    emitTypeAliasDeclaration(declaration);
}

const outputLines = [
    "from __future__ import annotations",
    "",
    "from enum import Enum",
    "from typing import Any, Literal, NotRequired, TypeAlias, TypedDict",
    "",
    `# Generated from ${toPosixPath(path.relative(rootDirectory, sourceFilePath))}`,
    "",
    ...emittedBlocks,
    "",
];

fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
fs.writeFileSync(outputFilePath, outputLines.join("\n"), "utf8");

console.log(`Wrote ${toPosixPath(path.relative(rootDirectory, outputFilePath))}`);

function emitEnumDeclaration(declaration) {
    const name = declaration.name.text;
    if (emittedNames.has(name)) {
        return;
    }

    const lines = [`class ${name}(str, Enum):`];
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

    const baseNames = [];
    for (const clause of declaration.heritageClauses ?? []) {
        if (clause.token !== ts.SyntaxKind.ExtendsKeyword) {
            continue;
        }

        for (const type of clause.types) {
            baseNames.push(type.expression.getText(sourceFile));
        }
    }

    const header =
        baseNames.length > 0
            ? `class ${name}(${baseNames.join(", ")}):`
            : `class ${name}(TypedDict):`;
    const lines = [header];
    const members = declaration.members.filter(ts.isPropertySignature);

    if (members.length === 0) {
        lines.push("    pass");
    }

    for (const member of members) {
        if (!member.type || !member.name) {
            continue;
        }

        const propertyName = getPropertyName(member.name);
        const propertyType = renderTypeNode(member.type, {
            parentName: `${name}${toPascalCase(propertyName)}`,
        });
        const renderedType = member.questionToken ? `NotRequired[${propertyType}]` : propertyType;
        lines.push(`    ${propertyName}: ${renderedType}`);
    }

    emittedNames.add(name);
    emittedBlocks.push(lines.join("\n"));
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
    emittedBlocks.push(`${name}: TypeAlias = ${renderedType}`);
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
    const expandedNames = [];

    for (const memberName of members) {
        const expandedName = ensureUniqueName(`${memberName}${declaration.name.text}`);
        emittedBlocks.push(`class ${expandedName}(${memberName}, ${fieldsName}):\n    pass`);
        emittedNames.add(expandedName);
        expandedNames.push(expandedName);
    }

    emittedBlocks.push(`${declaration.name.text}: TypeAlias = ${expandedNames.join(" | ")}`);
    return true;
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

function ensureInlineTypedDict(typeLiteralNode, suggestedName) {
    const name = ensureUniqueName(suggestedName);
    if (emittedNames.has(name)) {
        return name;
    }

    const lines = [`class ${name}(TypedDict):`];
    const members = typeLiteralNode.members.filter(ts.isPropertySignature);

    if (members.length === 0) {
        lines.push("    pass");
    }

    for (const member of members) {
        if (!member.type || !member.name) {
            continue;
        }

        const propertyName = getPropertyName(member.name);
        const propertyType = renderTypeNode(member.type, {
            parentName: `${name}${toPascalCase(propertyName)}`,
        });
        const renderedType = member.questionToken ? `NotRequired[${propertyType}]` : propertyType;
        lines.push(`    ${propertyName}: ${renderedType}`);
    }

    emittedNames.add(name);
    emittedBlocks.push(lines.join("\n"));
    return name;
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
            return typeName.includes(".") ? `Literal[${typeName}]` : typeName;
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

function toPosixPath(value) {
    return value.split(path.sep).join("/");
}
