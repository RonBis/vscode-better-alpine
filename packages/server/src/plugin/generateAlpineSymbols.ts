import * as html from "vscode-html-languageservice";
import { AlpineSymbols, type AlpineSymbolTable } from "./types";

let symbolTable: AlpineSymbolTable = [];

const htmlLs = html.getLanguageService();

export function generateAlpineSymbols(content: string) {
  const document = htmlLs.parseHTMLDocument(
    html.TextDocument.create("", "html", 0, content)
  );
  // if markup is empty, return
  if (document.roots.length === 0) {
    return;
  }

  // delete existing symbol table
  symbolTable = [];
  generateSymbolTable(document.roots[0], content);

  // writeFileSync(
  //   symbolTablePath,
  //   JSON.stringify(symbolTable).replace(/\\"/g, ""), // remove extra quotes ""
  //   {
  //     flag: "w",
  //     encoding: "utf-8",
  //   }
  // );
  return symbolTable;
}

function generateSymbolTable(root: html.Node, htmlContent: string) {
  const { attributes: attributesAll, start, end, startTagEnd, children } = root;
  if (!attributesAll) {
    return;
  }

  let symbols: AlpineSymbols = { attributes: [], scope: { start, end } };

  // filter Alpine attributes
  Object.entries(attributesAll).forEach(([attr, value], i) => {
    const regex =
      /(x-(data|init|show|bind|on|model|text|html|ref|for|if|cloak|spread|effect|transition)|(@\w+)|(x-on:\w+))/i;
    const regexSearchDomain = htmlContent.substring(start, startTagEnd);
    // if no alpine attribute is found, skip
    if (regex.exec(regexSearchDomain).length === 0) {
      return;
    }

    // find starting index of attribute value
    const startIndex =
      regexSearchDomain.indexOf(`${attr}=${value}`) + attr.length + 2; // +2 is for `=` and `"`
    const endIndex = startIndex + value.length;
    symbols.attributes[i] = {
      x_attr: attr,
      x_value: value,
      textrange: { start: startIndex, end: endIndex },
    };

    // switch (attr) {
    //   case "x-data":
    //   case "x-init":
    //   case "x-show":
    //   case "x-bind":
    //   case "x-on":
    //   case "x-model":
    //   case "x-text":
    //   case "x-html":
    //   case "x-ref":
    //   case "x-for":
    //   case "x-if":
    //   case "x-cloak":
    //   case "x-spread":
    //   case "x-effect":
    //   case "x-transition":
    //     symbols.attributes[i].x_attr = attr;
    //     symbols.attributes[i].x_value = value;
    //   default:
    //     if (attr.startsWith("x-on") || attr.startsWith("@")) {
    //       symbols.attributes[i].x_attr = attr;
    //       symbols.attributes[i].x_value = value;
    //     }
    //     // attribute text range should be in between 'start' and 'startTagEnd'
    //     const regex =
    //       /x-(data|init|show|bind|on|model|text|html|ref|for|if|cloak|spread|effect|transition)="([^"]+)"/;

    //     const regexSearchDomain = htmlContent.substring(start, startTagEnd);
    //     const match = regex.exec(regexSearchDomain)[2]; // match cannot be undefined or null

    //     const startIndex = regexSearchDomain.indexOf(match);
    //     symbols.attributes[i].textrange = {
    //       start: startIndex,
    //       end: startIndex + match.length,
    //     };
    // }
  });
  symbolTable.push(symbols);

  if (children.length === 0) return;
  for (const el of children) {
    generateSymbolTable(el, htmlContent); // recursive call
  }
}
