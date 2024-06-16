import { createWriteStream } from "fs";
import path from "path";

const log = createWriteStream(path.join(__dirname, "lsp.log"));

export default {
  write: (message: object | unknown) => {
    if (typeof message === "object") {
      log.write(JSON.stringify(message));
    } else {
      log.write(message.toString());
    }
    log.write("\n"); // for readability purpose
  },
};
