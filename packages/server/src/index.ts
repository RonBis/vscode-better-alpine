import { createServer, createConnection, loadTsdkByPath, createTypeScriptProject } from "@volar/language-server/node";
import { create as createTypeScriptServices } from "volar-service-typescript";
import { alpineLanguagePlugin } from "./plugin/alpinePlugin";
import { alpineServicePlugin } from "./service/alpineService";

const connection = createConnection();
const server = createServer(connection);

connection.listen();

connection.onInitialize((params) => {
  const tsdk = loadTsdkByPath(params.initializationOptions.typescript.tsdk, params.locale);
  return server.initialize(
    params,
    createTypeScriptProject(tsdk.typescript, tsdk.diagnosticMessages, () => [alpineLanguagePlugin]),
    [...createTypeScriptServices(tsdk.typescript), alpineServicePlugin]
  );
});

connection.onInitialized(server.initialized);
connection.onShutdown(server.shutdown);
