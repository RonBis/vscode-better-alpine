import {
  CodeMapping,
  LanguagePlugin,
  TypeScriptExtraServiceScript,
  VirtualCode,
  forEachEmbeddedCode,
} from "@volar/language-core";
import { IScriptSnapshot, ScriptKind } from "typescript";
import { URI } from "vscode-uri";
import { generateAlpineSymbols } from "./generateAlpineSymbols";
import { type AlpineSymbolTable } from "./types";

export const alpineLanguagePlugin: LanguagePlugin<URI> = {
  getLanguageId(uri) {
    if (uri.path.endsWith(".html")) {
      return "html";
    }
  },
  createVirtualCode(uri, languageId, snapshot, ctx) {
    if (languageId === "html") {
      return new AlpineCode(snapshot);
    }
  },
  typescript: {
    extraFileExtensions: [],
    getServiceScript() {
      return undefined;
    },
    getExtraServiceScripts(fileName, rootVirtualCode) {
      const scripts: TypeScriptExtraServiceScript[] = [];
      for (const code of forEachEmbeddedCode(rootVirtualCode)) {
        if (code.languageId === "javascript") {
          scripts.push({
            fileName: `${fileName}.${code.id}.js`,
            code,
            extension: ".js",
            scriptKind: ScriptKind.JS,
          });
        }
      }
      return scripts;
    },
  },
};

export class AlpineCode implements VirtualCode {
  id = "root";
  languageId = "html";
  mappings: CodeMapping[];
  embeddedCodes?: VirtualCode[];

  /**
   * Example HTML:
   * @example
   * <div x-data="{ open: false }">
   *   <button `@click`="open = true">Expand</button>
   *   <span x-show="open">Content...</span>
   * </div>
   *
   *
   * Example output:
   * @example
   * [
   *   {
   *     "alpineAttributes": {
   *       "x-data": "{ open: false }"
   *     },
   *     "start": 0,
   *     "end": 131
   *   },
   *   {
   *     "alpineAttributes": {
   *       "@click": "open = true"
   *     },
   *     "start": 34,
   *     "end": 78
   *   },
   *   {
   *     "alpineAttributes": {
   *       "x-show": "open"
   *     },
   *     "start": 84,
   *     "end": 123
   *   }
   * ]
   *
   */
  symbolTable: AlpineSymbolTable = [];
  jsVirtualCode = "";

  constructor(public snapshot: IScriptSnapshot) {
    this.mappings = [
      {
        sourceOffsets: [0],
        generatedOffsets: [0],
        lengths: [snapshot.getLength()],
        data: {
          completion: true,
          format: true,
          navigation: true,
          semantic: true,
          structure: true,
          verification: true,
        },
      },
    ];
    this.onSnapshotUpdated();
  }

  public update(newSnapshot: IScriptSnapshot) {
    this.snapshot = newSnapshot;
    this.onSnapshotUpdated();
  }

  public onSnapshotUpdated() {
    const snapshotContent = this.snapshot.getText(0, this.snapshot.getLength());
    const result = generateAlpineSymbols(snapshotContent);
    if (!result) {
      return;
    }
    this.symbolTable = result.symbolTable;
    this.jsVirtualCode = result.jsVirtualCode;
    this.embeddedCodes = [...getAlpineEmbeddedCodes(this.symbolTable, this.jsVirtualCode)];
  }
}

/** old code */
// function* _getAlpineEmbeddedCodes(symbolTable: AlpineSymbolTable): Generator<VirtualCode> {
//   for (let i = 0; i < symbolTable.length; i++) {
//     const tag = symbolTable[i];
//     const attributes = tag.attributes;

//     for (let j = 0; j < attributes.length; j++) {
//       const attr = attributes[j];

//       yield {
//         id: "alpine" + i + j,
//         languageId: "javascript",
//         snapshot: {
//           getText: (start, end) => attr.x_value.substring(start, end),
//           getLength: () => attr.x_value.length,
//           getChangeRange: () => undefined,
//         },
//         mappings: [
//           {
//             sourceOffsets: [attr.textrange.start],
//             generatedOffsets: [0],
//             lengths: [attr.x_value.length],
//             data: {
//               completion: true,
//               format: true,
//               navigation: true,
//               semantic: true,
//               structure: true,
//               verification: true,
//             },
//           },
//         ],
//       };
//     }
//   }
// }

/** new code */
function* getAlpineEmbeddedCodes(symbolTable: AlpineSymbolTable, jsVirtualCode: string): Generator<VirtualCode> {
  const mappings: CodeMapping[] = [];
  for (const tag of symbolTable) {
    for (const attr of tag.attributes) {
      mappings.push({
        sourceOffsets: [attr.sourceRange.start],
        lengths: [attr.sourceRange.end - attr.sourceRange.start],
        generatedOffsets: [attr.generatedRange.start],
        generatedLengths: [attr.generatedRange.end - attr.generatedRange.start],
        data: {
          completion: true,
          format: true,
          navigation: true,
          semantic: true,
          structure: true,
          verification: true,
        },
      });
    }
  }

  yield {
    id: "alpine",
    languageId: "javascript",
    snapshot: {
      getText: (start, end) => jsVirtualCode.substring(start, end),
      getLength: () => jsVirtualCode.length,
      getChangeRange: () => undefined,
    },
    mappings,
  };
}
