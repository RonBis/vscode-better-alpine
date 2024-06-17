import { createWriteStream } from "fs";

const log = createWriteStream(__dirname + "/../../../lsp.log");

export default {
  write: (message: object | unknown) => {
    if (typeof message === "object") {
      log.write(JSON.stringify(message));
    } else if (!message) {
      log.write("undefined value");
    } else {
      log.write(message.toString());
    }
    log.write("\n"); // for readability purpose
  },
};
