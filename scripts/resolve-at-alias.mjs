// Node's module customization hooks (resolve/load) are only picked up via
// `module.register()` — exporting a `resolve` function from a plain
// `--import`ed file does nothing on its own. This is the entry point
// `--import` actually loads; the hooks themselves live in
// resolve-at-alias.hooks.mjs.
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./resolve-at-alias.hooks.mjs", pathToFileURL(import.meta.dirname + "/"));
