import { writeFileSync } from "fs";
import * as html from "vscode-html-languageservice";
import { type AlpineSymbolTable, type AlpineAttribute } from "./types";

const htmlLs = html.getLanguageService();
const symbolTablePath = __dirname + "/../../../sample/symbol-table.json";

export function generateAlpineSymbols(content: string) {
  const document = htmlLs.parseHTMLDocument(html.TextDocument.create("", "html", 0, content));
  // if markup is empty, return
  if (document.roots.length === 0) {
    return null;
  }
  const symbolTable = generateSymbolTable(content);
  writeFileSync(
    symbolTablePath,
    JSON.stringify(symbolTable).replace(/\\"/g, ""), // remove extra quotes ""
    { flag: "w", encoding: "utf-8" }
  );
  return symbolTable;
}

const regex =
  /(x-(data|init|show|bind|on|model|text|html|ref|for|if|cloak|spread|effect|transition)|(@\w+)|(x-on:\w+))/i;

/** old code */
// function _generateSymbolTable(documentContent: string): AlpineSymbolTable {
//   let symbolTable: AlpineSymbolTable = [];

//   const scanner = htmlLs.createScanner(documentContent);
//   let lastTagName: string | null = null;
//   let lastTagOpenOffset: number | null = null;
//   let lastAttributeName: string | null = null;

//   let tagPath: string[] = [];
//   let tagAttributes: AlpineAttribute[] = [];
//   let _tagEndRef: number[] = [];

//   let token = scanner.scan();
//   while (token !== html.TokenType.EOS) {
//     switch (token) {
//       case html.TokenType.StartTag:
//         tagAttributes = []; // clear tag attributes of previous tag
//         lastTagName = scanner.getTokenText();
//         lastTagOpenOffset = scanner.getTokenOffset();
//         lastAttributeName = null;
//         tagPath.push(lastTagName);
//         break;
//       case html.TokenType.AttributeName:
//         lastAttributeName = scanner.getTokenText();
//         const didMatch = Boolean(regex.exec(lastAttributeName)?.length);
//         if (!didMatch) {
//           lastAttributeName = null;
//         }
//         break;
//       case html.TokenType.AttributeValue:
//         // if last attribute was not an alpine attribute, skip
//         if (lastAttributeName === null) {
//           break;
//         }
//         tagAttributes.push({
//           x_attr: lastAttributeName,
//           x_value: scanner.getTokenText().slice(1, -1), // remove extra quotes
//           textrange: {
//             start: scanner.getTokenOffset() + 1, // ignore quote in js virtual code
//             end: scanner.getTokenEnd() - 1, // ignore quote in js virtual code
//           },
//         });
//         break;
//       case html.TokenType.StartTagClose:
//         symbolTable.push({
//           attributes: tagAttributes,
//           path: [...tagPath], // to prevent shallow copy
//           scope: {
//             start: lastTagOpenOffset!, // test this(!) later with sample html: ">hello</p>"
//             end: 0, // set later in tag end using _tagEndRef
//           },
//         });
//         _tagEndRef.push(symbolTable.length - 1);
//         break;
//       case html.TokenType.EndTag:
//         tagPath.splice(-1); // remove last element
//         symbolTable[_tagEndRef.at(-1)!].scope.end = scanner.getTokenEnd();
//         _tagEndRef.splice(-1);
//         break;
//     }
//     token = scanner.scan();
//   }
//   return symbolTable;
// }

/** new code */
function generateSymbolTable(documentContent: string) {
  let mapping: AlpineSymbolTable = [];

  /** Refer to sample/x.js. */
  let jsVirtualCode = ""; //TODO: maybe optimize later
  let oCount = 0; // number of x-data objects encountered

  const scanner = htmlLs.createScanner(documentContent);
  let lastTagDetails = {
    // tagname
    hasXDataAttribute: false,
  };
  let lastAttributeName: string | null = null;
  let tagAttributes: AlpineAttribute[] = [];
  let xDataScope: boolean[] = [];

  let token = scanner.scan();
  while (token !== html.TokenType.EOS) {
    switch (token) {
      case html.TokenType.StartTag:
        tagAttributes = []; // clear tag attributes of previous tag
        lastAttributeName = null;
        break;
      case html.TokenType.AttributeName:
        lastAttributeName = scanner.getTokenText();
        const didMatch = Boolean(regex.exec(lastAttributeName)?.length); // match any alpine attribute
        if (!didMatch) {
          lastAttributeName = null; // reject any non-alpine attribute
        }
        break;
      case html.TokenType.AttributeValue:
        // if last attribute was not an alpine attribute, skip
        if (lastAttributeName === null) {
          break;
        }
        const attributeValue = scanner.getTokenText().slice(1, -1); // remove extra quotes
        const sourceRange = {
          start: scanner.getTokenOffset() + 1, // ignore extra quote in js virtual code
          end: scanner.getTokenEnd() - 1, // ignore extra quote in js virtual code
        };

        let pre = "";
        if (lastAttributeName === "x-data") {
          lastTagDetails.hasXDataAttribute = true;
          pre = `\r\n{\r\nconst o${oCount++}=`;
        } else {
          lastTagDetails.hasXDataAttribute = false;
          pre = `\r\n`;
        }
        const generatedRange = {
          start: jsVirtualCode.length + pre.length,
          end: jsVirtualCode.length + pre.length + attributeValue.length,
        };
        jsVirtualCode += pre + attributeValue;

        tagAttributes.push({
          xattr: lastAttributeName,
          xvalue: attributeValue,
          sourceRange,
          generatedRange,
        });
        break;
      case html.TokenType.StartTagClose:
        // if there is no mapping, skip
        if (tagAttributes.length === 0) {
          break;
        }
        mapping.push({
          attributes: tagAttributes,
        });
        xDataScope.push(lastTagDetails.hasXDataAttribute);
        break;
      case html.TokenType.EndTag:
        const isXDataScope = xDataScope.pop(); // remove last element
        if (isXDataScope) {
          jsVirtualCode += "\r\n}"; // insert scope close
        }
        break;
    }
    token = scanner.scan();
  }
  return { symbolTable: mapping, jsVirtualCode };
}
