import { fileURLToPath } from "url";
import path from "path";

function getDirname(metaUrl) {
  const __filename = fileURLToPath(metaUrl);
  return path.dirname(__filename);
}

export { getDirname };
