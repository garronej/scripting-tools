"use strict";
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
var scriptLib = require("../lib");
var path = require("path");
var fs = require("fs");
console.assert(scriptLib.find_module_path("typescript", path.join(__dirname, "../.."))
    ===
        path.join(__dirname, "..", "..", "node_modules/typescript"));
var dir_path = "/var/tmp/scripting-tools-tests";
var dir_path_copy = path.join(dir_path, "..", path.basename(dir_path) + "-copy");
scriptLib.execSync("rm -rf " + dir_path + " " + dir_path_copy + " && mkdir -p " + path.join(dir_path, "dir"));
scriptLib.execSync("echo \"[content of file 1]\" > file1.txt", { "cwd": dir_path });
scriptLib.execSync("echo \"[content of file 2]\" > file2.txt", { "cwd": dir_path });
scriptLib.execSync("echo \"[content of file 3]\" > dir/file3.txt", { "cwd": dir_path });
scriptLib.fs_move("COPY", dir_path, dir_path_copy);
console.assert(scriptLib.fs_areSame(dir_path, dir_path_copy));
scriptLib.execSync("echo \"(modified)\" >> file2.txt", { "cwd": dir_path });
try {
    for (var _a = __values(scriptLib.fs_ls(dir_path)), _b = _a.next(); !_b.done; _b = _a.next()) {
        var name = _b.value;
        console.assert(scriptLib.fs_areSame(dir_path, dir_path_copy, name) === (name !== "file2.txt"));
    }
}
catch (e_1_1) { e_1 = { error: e_1_1 }; }
finally {
    try {
        if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
    }
    finally { if (e_1) throw e_1.error; }
}
scriptLib.fs_move("MOVE", dir_path, dir_path_copy, "file2.txt");
console.assert(!fs.existsSync(path.join(dir_path, "file2.txt")));
scriptLib.fs_ln_s(path.join(dir_path_copy, "file2.txt"), path.join(dir_path, "file2.txt"));
console.assert(scriptLib.fs_areSame(dir_path, dir_path_copy));
scriptLib.download_and_extract_tarball("https://github.com/jquery/jquery/archive/3.3.1.tar.gz", dir_path, "MERGE");
scriptLib.download_and_extract_tarball("https://github.com/jquery/jquery/archive/3.3.1.tar.gz", dir_path_copy, "OVERWRITE IF EXIST");
scriptLib.execSync("rm -rf " + dir_path + " " + dir_path_copy);
console.log(scriptLib.colorize("OK", "GREEN"));
var e_1, _c;
