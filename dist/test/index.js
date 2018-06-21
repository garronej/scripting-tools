"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var scriptLib = require("../lib");
var path = require("path");
var fs = require("fs");
process.removeAllListeners("unhandledRejection");
process.once("unhandledRejection", function (error) { throw error; });
(function () { return __awaiter(_this, void 0, void 0, function () {
    var e_1, _a, _b, p_wget, p_node, url, before, _c, _d, _e, _f, _g, dir_path, dir_path_copy, _h, _j, name, _k, exec, onSuccess, _l, _m;
    return __generator(this, function (_o) {
        switch (_o.label) {
            case 0:
                _b = __read(["/tmp/v_wget", "/tmp/v_node"], 2), p_wget = _b[0], p_node = _b[1];
                scriptLib.execSync("rm -f " + p_wget + " " + p_node);
                url = "github.com/jquery/jquery/archive/3.3.1.tar.gz";
                before = Date.now();
                return [4 /*yield*/, scriptLib.web_get(url, p_node)];
            case 1:
                _o.sent();
                console.log("node: " + (Date.now() - before) + " ms");
                before = Date.now();
                return [4 /*yield*/, scriptLib.exec("wget -nc " + url + " -q -O " + p_wget)];
            case 2:
                _o.sent();
                console.log("wget: " + (Date.now() - before) + " ms");
                console.assert(scriptLib.fs_areSame(p_wget, p_node));
                scriptLib.execSync("rm -f " + p_wget + " " + p_node);
                _d = (_c = console).assert;
                _e = require("../../package.json")["name"];
                _g = (_f = JSON).parse;
                return [4 /*yield*/, scriptLib.web_get("https://raw.githubusercontent.com/garronej/scripting-tools/master/package.json")];
            case 3:
                _d.apply(_c, [_e ===
                        _g.apply(_f, [_o.sent()])["name"]]);
                console.assert(scriptLib.find_module_path("typescript", path.join(__dirname, "../.."))
                    ===
                        path.join(__dirname, "..", "..", "node_modules/typescript"));
                dir_path = "/var/tmp/scripting-tools-tests";
                dir_path_copy = path.join(dir_path, "..", path.basename(dir_path) + "-copy");
                scriptLib.execSync("rm -rf " + dir_path + " " + dir_path_copy + " && mkdir -p " + path.join(dir_path, "dir"));
                scriptLib.execSync("echo \"[content of file 1]\" > file1.txt", { "cwd": dir_path });
                scriptLib.execSync("echo \"[content of file 2]\" > file2.txt", { "cwd": dir_path });
                scriptLib.execSync("echo \"[content of file 3]\" > dir/file3.txt", { "cwd": dir_path });
                scriptLib.fs_move("COPY", dir_path, dir_path_copy);
                console.assert(scriptLib.fs_areSame(dir_path, dir_path_copy));
                scriptLib.execSync("echo \"(modified)\" >> file2.txt", { "cwd": dir_path });
                try {
                    for (_h = __values(scriptLib.fs_ls(dir_path)), _j = _h.next(); !_j.done; _j = _h.next()) {
                        name = _j.value;
                        console.assert(scriptLib.fs_areSame(dir_path, dir_path_copy, name) === (name !== "file2.txt"));
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_j && !_j.done && (_a = _h.return)) _a.call(_h);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                //scriptLib.fs_move("MOVE", dir_path, dir_path_copy, "file2.txt");
                scriptLib.fs_move("MOVE", dir_path, dir_path_copy, path.join(dir_path_copy, "file2.txt"));
                console.assert(!fs.existsSync(path.join(dir_path, "file2.txt")));
                scriptLib.createSymlink(path.join(dir_path_copy, "file2.txt"), path.join(dir_path, "file2.txt"));
                console.assert(scriptLib.fs_areSame(dir_path, dir_path_copy));
                return [4 /*yield*/, scriptLib.download_and_extract_tarball(url, dir_path, "MERGE")];
            case 4:
                _o.sent();
                return [4 /*yield*/, scriptLib.download_and_extract_tarball(url, dir_path_copy, "OVERWRITE IF EXIST")];
            case 5:
                _o.sent();
                scriptLib.enableCmdTrace();
                scriptLib.execSync("rm -rf " + dir_path + " " + dir_path_copy);
                _k = scriptLib.start_long_running_process("Phony process"), exec = _k.exec, onSuccess = _k.onSuccess;
                _m = (_l = console).assert;
                return [4 /*yield*/, exec("echo \"foobar\"")];
            case 6:
                _m.apply(_l, [(_o.sent()) === "foobar\n"]);
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
            case 7:
                _o.sent();
                onSuccess();
                console.assert(scriptLib.sh_eval("which cat") === "/bin/cat");
                console.assert(scriptLib.sh_if("cat tmp/file_that_does_not_exist.dummy") === false);
                console.assert(scriptLib.sh_if("which git") === true);
                return [4 /*yield*/, scriptLib.apt_get_install_if_missing("git")];
            case 8:
                _o.sent();
                console.log(scriptLib.colorize("ALL TESTS PASSED", "GREEN"));
                return [2 /*return*/];
        }
    });
}); })();
/*
(async () => {

    while (true) {

        await new Promise(resolve => setTimeout(resolve, 2000));


        (function print_mem() {

            const used = process.memoryUsage();
            for (let key in used) {
                console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
            }

        })();

    }

})();
*/ 
