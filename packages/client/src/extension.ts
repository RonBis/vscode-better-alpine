import * as serverProtocol from "@volar/language-server/protocol";
import { createLabsInfo, getTsdk } from "@volar/vscode";
import * as vscode from "vscode";
import * as lsp from "vscode-languageclient/node";

let client: lsp.BaseLanguageClient;

// As its name suggests, this function is called when the extension is activated.
export async function activate(context: vscode.ExtensionContext) {
  const serverModule = vscode.Uri.joinPath(
    context.extensionUri,
    "dist",
    "server.js"
  );
  const serverOptions: lsp.ServerOptions = {
    run: {
      module: serverModule.fsPath,
      transport: lsp.TransportKind.ipc,
      options: { execArgv: <string[]>[] },
    },
    debug: {
      module: serverModule.fsPath,
      transport: lsp.TransportKind.ipc,
      options: { execArgv: ["--nolazy", "--inspect=" + 6009] },
    },
  };

  // Options to control the language client, in this case we're only interested
  // in HTML1 files. Language servers can also accept initialization options, which
  // are passed to the server when it starts, but we don't have any here.
  const clientOptions: lsp.LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "html" }],
    initializationOptions: {
      typescript: {
        tsdk: (await getTsdk(context))!.tsdk,
      },
    },
  };

  // Create the language client with all the options we've defined, and start it.
  client = new lsp.LanguageClient(
    "alpineLS",
    "AlpineLS",
    serverOptions,
    clientOptions
  );
  await client.start();

  // Needed code to add support for Volar Labs
  // https://volarjs.dev/core-concepts/volar-labs/
  const labsInfo = createLabsInfo(serverProtocol);
  labsInfo.addLanguageClient(client);
  return labsInfo.extensionExports;
}

// ... and this function is called when the extension is deactivated!
export function deactivate(): Thenable<any> | undefined {
  return client?.stop();
}
