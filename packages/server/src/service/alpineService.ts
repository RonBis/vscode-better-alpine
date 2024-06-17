import {
  LanguageServiceContext,
  LanguageServicePlugin,
} from "@volar/language-service";
import { TextDocument } from "vscode-languageserver-textdocument";
import { URI } from "vscode-uri";
import { AlpineCode } from "../plugin/alpinePlugin";
import { AlpineSymbolTable } from "../plugin/types";

export const alpineServicePlugin: LanguageServicePlugin = {
  name: "alpine-service",
  capabilities: {
    completionProvider: {},
    diagnosticProvider: {},
    hoverProvider: true,
  },
  create: (context) => {
    return {
      provideHover(document, position, token) {
        const decoded = context.decodeEmbeddedDocumentUri(
          URI.parse(document.uri)
        );
        if (!decoded) {
          // Not a embedded document
          return;
        }
        const virtualCode = context.language.scripts
          .get(decoded[0])
          ?.generated?.embeddedCodes.get(decoded[1]);
        if (!(virtualCode instanceof AlpineCode)) {
          return;
        }
        return null;
      },
    };
  },
};

function getSymbolTable(
  context: LanguageServiceContext,
  document: TextDocument
): AlpineSymbolTable | null {
  const decoded = context.decodeEmbeddedDocumentUri(URI.parse(document.uri));
  if (!decoded) return null; // not an embedded document

  const virtualCode = context.language.scripts
    .get(decoded[0])
    ?.generated?.embeddedCodes.get(decoded[1]);
  if (!(virtualCode instanceof AlpineCode)) return null;

  return virtualCode.symbolTable;
}
