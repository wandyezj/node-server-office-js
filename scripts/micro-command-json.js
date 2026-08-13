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
const outputFilePaths = [
    path.join(rootDirectory, "test", "commands", "schema", "micro-command.schema.json"),
    path.join(rootDirectory, "dist", "micro-command.schema.json"),
];

const sourceText = fs.readFileSync(sourceFilePath, "utf8");
const sourceFile = ts.createSourceFile(sourceFilePath, sourceText, ts.ScriptTarget.Latest, true);
const declarations = new Map();

for (const statement of sourceFile.statements) {
    if (!statement.name || !ts.isIdentifier(statement.name)) {
        continue;
    }

    if (
        ts.isEnumDeclaration(statement) ||
        ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement)
    ) {
        declarations.set(statement.name.text, statement);
    }
}

function getPropertyName(nameNode) {
    return ts.isIdentifier(nameNode) || ts.isStringLiteral(nameNode)
        ? nameNode.text
        : nameNode.getText(sourceFile);
}

function getTypeName(typeNode) {
    return (typeNode.typeName ?? typeNode.expression).getText(sourceFile);
}

function getLiteralValue(literalNode) {
    if (ts.isStringLiteral(literalNode)) {
        return literalNode.text;
    }

    if (ts.isNumericLiteral(literalNode)) {
        return Number(literalNode.text);
    }

    if (literalNode.kind === ts.SyntaxKind.TrueKeyword) {
        return true;
    }

    if (literalNode.kind === ts.SyntaxKind.FalseKeyword) {
        return false;
    }

    return null;
}

function getInterfaceMembers(declaration) {
    const members = [];
    for (const heritageClause of declaration.heritageClauses ?? []) {
        if (heritageClause.token !== ts.SyntaxKind.ExtendsKeyword) {
            continue;
        }

        for (const type of heritageClause.types) {
            const baseDeclaration = declarations.get(getTypeName(type));
            if (baseDeclaration && ts.isInterfaceDeclaration(baseDeclaration)) {
                members.push(...getInterfaceMembers(baseDeclaration));
            }
        }
    }

    members.push(...declaration.members.filter(ts.isPropertySignature));
    return members;
}

function schemaForType(typeNode) {
    if (ts.isParenthesizedTypeNode(typeNode)) {
        return schemaForType(typeNode.type);
    }

    if (ts.isLiteralTypeNode(typeNode)) {
        return { const: getLiteralValue(typeNode.literal) };
    }

    if (ts.isArrayTypeNode(typeNode)) {
        return { type: "array", items: schemaForType(typeNode.elementType) };
    }

    if (ts.isTypeLiteralNode(typeNode)) {
        return schemaForObjectMembers(typeNode.members.filter(ts.isPropertySignature));
    }

    if (ts.isUnionTypeNode(typeNode)) {
        const schemas = typeNode.types
            .filter((child) => child.kind !== ts.SyntaxKind.UndefinedKeyword)
            .map(schemaForType);
        return schemas.length === 1 ? schemas[0] : { oneOf: schemas };
    }

    if (ts.isTypeReferenceNode(typeNode)) {
        const typeName = getTypeName(typeNode);
        if (typeName === "Array" || typeName === "ReadonlyArray") {
            return {
                type: "array",
                items: typeNode.typeArguments?.[0] ? schemaForType(typeNode.typeArguments[0]) : {},
            };
        }

        if (typeName.includes(".")) {
            const [enumName, memberName] = typeName.split(".");
            const enumDeclaration = declarations.get(enumName);
            const enumMember = enumDeclaration?.members.find(
                (member) => member.name.getText(sourceFile) === memberName,
            );
            if (enumMember) {
                return {
                    const: enumMember.initializer
                        ? getLiteralValue(enumMember.initializer)
                        : memberName,
                };
            }
        }

        return { $ref: `#/$defs/${typeName}` };
    }

    switch (typeNode.kind) {
        case ts.SyntaxKind.StringKeyword:
            return { type: "string" };
        case ts.SyntaxKind.NumberKeyword:
            return { type: "number" };
        case ts.SyntaxKind.BooleanKeyword:
            return { type: "boolean" };
        case ts.SyntaxKind.AnyKeyword:
        case ts.SyntaxKind.UnknownKeyword:
            return {};
        case ts.SyntaxKind.NullKeyword:
            return { type: "null" };
        default:
            return {};
    }
}

function schemaForObjectMembers(members) {
    const properties = {};
    const required = [];

    for (const member of members) {
        if (!member.name || !member.type) {
            continue;
        }

        const propertyName = getPropertyName(member.name);
        properties[propertyName] = schemaForType(member.type);
        if (!member.questionToken && !required.includes(propertyName)) {
            required.push(propertyName);
        }
    }

    const schema = {
        type: "object",
        properties,
        additionalProperties: false,
    };
    if (required.length > 0) {
        schema.required = required;
    }
    return schema;
}

function schemaForDeclaration(declaration) {
    if (ts.isEnumDeclaration(declaration)) {
        return {
            enum: declaration.members.map((member) =>
                member.initializer
                    ? getLiteralValue(member.initializer)
                    : member.name.getText(sourceFile),
            ),
        };
    }

    if (ts.isInterfaceDeclaration(declaration)) {
        return schemaForObjectMembers(getInterfaceMembers(declaration));
    }

    return schemaForType(declaration.type);
}

const schema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://github.com/wandyezj/node-server-office-js/schemas/micro-command.schema.json",
    title: "Micro Command Request",
    type: "object",
    properties: {
        commands: {
            type: "array",
            items: { $ref: "#/$defs/MicroCommand" },
        },
    },
    required: ["commands"],
    additionalProperties: false,
    $defs: {},
};

for (const [name, declaration] of declarations) {
    schema.$defs[name] = schemaForDeclaration(declaration);
}

const schemaText = `${JSON.stringify(schema, null, 4)}\n`;
for (const outputFilePath of outputFilePaths) {
    fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
    fs.writeFileSync(outputFilePath, schemaText, "utf8");
    console.log(`Wrote ${path.relative(rootDirectory, outputFilePath).replaceAll(path.sep, "/")}`);
}
