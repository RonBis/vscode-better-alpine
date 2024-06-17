import { createServer, createConnection, createSimpleProject } from "@volar/language-server/node";
import { alpineLanguagePlugin } from "./plugin/alpinePlugin";
import { alpineServicePlugin } from "./service/alpineService";

const connection = createConnection();
const server = createServer(connection);

connection.listen();

connection.onInitialize((params) => {
  // const tsdk = loadTsdkByPath(
  //   params.initializationOptions.typescript.tsdk,
  //   params.locale
  // );

  return server.initialize(params, createSimpleProject([alpineLanguagePlugin]), [alpineServicePlugin]);
});

connection.onInitialized(server.initialized);
connection.onShutdown(server.shutdown);
