"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
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
var child_process = require("child_process");
var readline = require("readline");
var fs = require("fs");
var path = require("path");
var https = require("https");
var http = require("http");
/**
 * After this function is called every call to execSync
 * or exec will print the unix commands being executed.
 * */
function enableCmdTrace() {
    traceCmdIfEnabled.enabled = true;
}
exports.enableCmdTrace = enableCmdTrace;
function traceCmdIfEnabled(cmd, options) {
    if (!traceCmdIfEnabled.enabled) {
        return;
    }
    console.log(colorize("$ " + cmd + " ", "YELLOW") + (!!options ? JSON.stringify(options) + "\n" : ""));
}
(function (traceCmdIfEnabled) {
    traceCmdIfEnabled.enabled = false;
})(traceCmdIfEnabled || (traceCmdIfEnabled = {}));
function fetch_id(options) {
    if (!options) {
        return;
    }
    if (!!options.unix_user) {
        var unix_user_1 = options.unix_user;
        delete options.unix_user;
        var get_id = function (type) {
            return parseInt(child_process.execSync("id -" + type + " " + unix_user_1)
                .toString("utf8")
                .slice(0, -1));
        };
        options.uid = get_id("u");
        options.gid = get_id("g");
    }
}
function colorize(str, color) {
    var color_code = (function () {
        switch (color) {
            case "GREEN": return "\x1b[32m";
            case "RED": return "\x1b[31m";
            case "YELLOW": return "\x1b[33m";
        }
    })();
    return "" + color_code + str + "\u001B[0m";
}
exports.colorize = colorize;
/**
 *
 * The stderr is forwarded to the console realtime.
 *
 * The returned value is the concatenated data received on stdout.
 *
 * If the return code of the cmd is not 0 an exception is thrown
 * and the message cmd + the concatenated data received on stderr.
 *
 * If enableTrace() have been called the command called will be printed.
 *
 */
function execSync(cmd, options) {
    traceCmdIfEnabled(cmd, options);
    fetch_id(options);
    return child_process.execSync(cmd, __assign({}, (options || {}), { "encoding": "utf8" }));
}
exports.execSync = execSync;
/**
 *
 * The cmd is printed before execution
 * stdout and stderr are forwarded to the console realtime.
 * Return nothing.
 *
 * stdio is set to "inherit" and thus should not be redefined.
 *
 */
function execSyncTrace(cmd, options) {
    traceCmdIfEnabled(cmd, options);
    fetch_id(options);
    child_process.execSync(cmd, __assign({}, (options || {}), { "stdio": "inherit" }));
}
exports.execSyncTrace = execSyncTrace;
/** Same as execSync except that it dose not print cmd even if cmdTrace have been enabled */
var execSyncNoCmdTrace = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var enabled_back = traceCmdIfEnabled.enabled;
    traceCmdIfEnabled.enabled = false;
    try {
        var out = execSync.apply(null, args);
        traceCmdIfEnabled.enabled = enabled_back;
        return out;
    }
    catch (error) {
        traceCmdIfEnabled.enabled = enabled_back;
        throw error;
    }
};
/**
 *
 * Like execSync but stderr is not forwarded.
 * WARNING: If mean that when the cmd return 0
 * all data that may have been wrote on stderr
 * are lost into oblivion.
 *
 * stdio is set to "pipe" and thus should not be redefined.
 *
 */
function execSyncQuiet(cmd, options) {
    return execSync(cmd, __assign({}, (options || {}), { "stdio": "pipe" }));
}
exports.execSyncQuiet = execSyncQuiet;
/** Same as execSync but async */
function exec(cmd, options) {
    var _this = this;
    traceCmdIfEnabled(cmd, options);
    return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            fetch_id(options);
            child_process.exec(cmd, __assign({}, (options || {}), { "encoding": "utf8" }), function (error, stdout, stderr) {
                if (!!error) {
                    error["stderr"] = stderr;
                    reject(error);
                }
                else {
                    resolve(stdout);
                }
            });
            return [2 /*return*/];
        });
    }); });
}
exports.exec = exec;
/**
 *
 * Print a message and enable a moving loading bar.
 * WARNING: Nothing should be printed to stdout until we stop showing the moving loading.
 *
 * returns:
 * -exec: A proxy to the exec fnc that will call onError before it throw the error.
 * -onSuccess: Stop showing the moving loading and pretty print a success message ("ok" by default)
 * -onError: Stop showing the moving loading and pretty print error message.
 *
 */
function start_long_running_process(message) {
    process.stdout.write(message + "... ");
    var moveBack = (function () {
        var cp = message.length + 3;
        return function () { return readline.cursorTo(process.stdout, cp); };
    })();
    var p = ["\\", "|", "/", "-"].map(function (i) { return colorize(i, "GREEN"); });
    var x = 0;
    var timer = setInterval(function () {
        moveBack();
        process.stdout.write(p[x++]);
        x = x % p.length;
    }, 250);
    var onComplete = function (message) {
        clearInterval(timer);
        moveBack();
        process.stdout.write(message + "\n");
    };
    var onError = function (errorMessage) { return onComplete(colorize(errorMessage, "RED")); };
    var onSuccess = function (message) { return onComplete(colorize(message || "ok", "GREEN")); };
    if (traceCmdIfEnabled.enabled) {
        onComplete("");
        onComplete = function (message) { return console.log(message); };
    }
    return {
        onError: onError,
        onSuccess: onSuccess,
        "exec": function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return __awaiter(this, void 0, void 0, function () {
                var error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, exec.apply(null, args)];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2:
                            error_1 = _a.sent();
                            onError(error_1.message);
                            throw error_1;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        }
    };
}
exports.start_long_running_process = start_long_running_process;
;
/**
 * Apt package if not already installed,
 * if prog is provided and prog is in the PATH the package will not be installed
 * */
function apt_get_install_if_missing(package_name, prog) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    process.stdout.write("Looking for " + package_name + " ... ");
                    if (!!prog && apt_get_install_if_missing.doesHaveProg(prog)) {
                        console.log(prog + " executable found. " + colorize("OK", "GREEN"));
                        return [2 /*return*/];
                    }
                    if (apt_get_install_if_missing.isPkgInstalled(package_name)) {
                        console.log(package_name + " is installed. " + colorize("OK", "GREEN"));
                        return [2 /*return*/];
                    }
                    readline.clearLine(process.stdout, 0);
                    process.stdout.write("\r");
                    return [4 /*yield*/, apt_get_install(package_name)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
exports.apt_get_install_if_missing = apt_get_install_if_missing;
(function (apt_get_install_if_missing) {
    function isPkgInstalled(package_name) {
        try {
            console.assert(!!execSyncNoCmdTrace("dpkg-query -W -f='${Status}' " + package_name, { "stdio": "pipe" })
                .match(/^install ok installed$/));
        }
        catch (_a) {
            return false;
        }
        return true;
    }
    apt_get_install_if_missing.isPkgInstalled = isPkgInstalled;
    function doesHaveProg(prog) {
        try {
            execSyncNoCmdTrace("which " + prog);
        }
        catch (_a) {
            return false;
        }
        return true;
    }
    apt_get_install_if_missing.doesHaveProg = doesHaveProg;
})(apt_get_install_if_missing = exports.apt_get_install_if_missing || (exports.apt_get_install_if_missing = {}));
/** Install or upgrade package via APT */
function apt_get_install(package_name) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, onSuccess, exec, was_installed_before, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = start_long_running_process("Installing or upgrading " + package_name + " package"), onSuccess = _a.onSuccess, exec = _a.exec;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 5, , 6]);
                    if (!apt_get_install.isFirst) return [3 /*break*/, 3];
                    return [4 /*yield*/, exec("apt-get update")];
                case 2:
                    _b.sent();
                    apt_get_install.isFirst = false;
                    _b.label = 3;
                case 3:
                    was_installed_before = apt_get_install_if_missing.isPkgInstalled(package_name);
                    return [4 /*yield*/, exec("apt-get -y install " + package_name)];
                case 4:
                    _b.sent();
                    if (!was_installed_before) {
                        apt_get_install.onInstallSuccess(package_name);
                    }
                    return [3 /*break*/, 6];
                case 5:
                    error_2 = _b.sent();
                    apt_get_install.onError(error_2);
                    return [3 /*break*/, 6];
                case 6:
                    onSuccess("DONE");
                    return [2 /*return*/];
            }
        });
    });
}
exports.apt_get_install = apt_get_install;
(function (apt_get_install) {
    apt_get_install.isFirst = true;
    function record_installed_package(file_json_path, package_name) {
        execSyncNoCmdTrace("touch " + file_json_path);
        var raw = fs.readFileSync(file_json_path).toString("utf8");
        var list = raw === "" ? [] : JSON.parse(raw);
        if (!list.find(function (p) { return p === package_name; })) {
            list.push(package_name);
            fs.writeFileSync(file_json_path, Buffer.from(JSON.stringify(list, null, 2), "utf8"));
        }
    }
    apt_get_install.record_installed_package = record_installed_package;
    apt_get_install.onError = function (error) { throw error; };
    apt_get_install.onInstallSuccess = function (package_name) { };
})(apt_get_install = exports.apt_get_install || (exports.apt_get_install = {}));
function exit_if_not_root() {
    if (process.getuid() !== 0) {
        console.log(colorize("Error: This script require root privilege", "RED"));
        process.exit(1);
    }
}
exports.exit_if_not_root = exit_if_not_root;
/**
 *
 * Locate a given module in a node_modules directory.
 * If the module is required in different version and thus
 * present multiple times will be returned the shorter path.
 * This ensure that if a given module is in package.json 's dependencies
 * section the returned path will be the one we looking for.
 *
 * @param module_name The name of the module.
 * @param module_dir_path Path to the root of the module ( will search in ./node_modules ).
 */
function find_module_path(module_name, module_dir_path) {
    var cmd = [
        "find " + path.join(module_dir_path, "node_modules"),
        "-type f",
        "-path \\*/node_modules/" + module_name + "/package.json",
        "-exec dirname {} \\;"
    ].join(" ");
    var match = execSyncNoCmdTrace(cmd, { "stdio": "pipe" }).slice(0, -1).split("\n");
    if (!match.length) {
        throw new Error(module_name + " not found in " + module_dir_path);
    }
    else {
        return match.sort(function (a, b) { return a.length - b.length; })[0];
    }
}
exports.find_module_path = find_module_path;
/**
 *
 * Test if two file of folder are same.
 * Does not consider stat ( ownership and permission ).
 * transparent handling of symlinks.
 *
 * Example
 *
 * /foo1/bar/file.txt
 * /foo2/bar/file.txt
 *
 * to compare the two version of file.txt
 * call with "/foo1", "/foo2", "./bar/file.txt";
 * or with "/foo1/bar/file.txt", "/foo2/bar/file.txt"
 *
 * @param relative_from_path1 absolute path ex: '/foo1'
 * @param relative_from_path2 absolute path ex: '/foo2'
 * @param relative_to_path relative path ex: './bar/file.txt" or 'bar/file.txt'
 * for convenience relative_to_path can be absolute as long as it has relative_from_path1
 * or relative_from_path2 as parent.
 *
 */
function fs_areSame(relative_from_path1, relative_from_path2, relative_to_path) {
    if (relative_to_path === void 0) { relative_to_path = "."; }
    relative_to_path = fs_areSame.get_relative_to_path(relative_from_path1, relative_from_path2, relative_to_path);
    try {
        execSyncNoCmdTrace([
            "diff -r",
            path.join(relative_from_path1, relative_to_path),
            path.join(relative_from_path2, relative_to_path)
        ].join(" "), { "stdio": "pipe" });
    }
    catch (_a) {
        return false;
    }
    return true;
}
exports.fs_areSame = fs_areSame;
(function (fs_areSame) {
    function get_relative_to_path(dir_path1, dir_path2, to_path) {
        if (path.isAbsolute(to_path)) {
            var dir_path = [dir_path1, dir_path2]
                .filter(function (v) { return to_path.startsWith(v); })
                .sort(function (a, b) { return b.length - a.length; })[0];
            if (!dir_path) {
                throw new Error("Not relative!");
            }
            return path.relative(dir_path, to_path);
        }
        else {
            return to_path;
        }
    }
    fs_areSame.get_relative_to_path = get_relative_to_path;
})(fs_areSame = exports.fs_areSame || (exports.fs_areSame = {}));
/**
 *
 * Move or copy file of folder.
 * -If dest is identical to source nothing is copied nor moved.
 * -If dest exist and is different of source it will be deleted prior to proceeding with action.
 * -In move mode if dest identical to source source will be removed.
 * -When copy is effectively performed the stat are conserved.
 * -If dirname of dest does not exist in fs, it will be created.
 * -Unlike cp or mv "/src/file.txt" "/dest" will NOT place file.txt in dest but dest will become file.txt
 *
 * calling [action] "/src/foo" "/dst/foo" is equivalent
 * to calling [action] "/src" "/dst" "./foo" ( or "foo" )
 * or [action] "/src" "/dst" "src/foo"
 * or [action] "/src" "/dst" "dst/foo"
 *
 */
function fs_move(action, relative_from_path_src, relative_from_path_dest, relative_to_path) {
    if (relative_to_path === void 0) { relative_to_path = "."; }
    relative_to_path = fs_areSame.get_relative_to_path(relative_from_path_src, relative_from_path_dest, relative_to_path);
    var src_path = path.join(relative_from_path_src, relative_to_path);
    var dst_path = path.join(relative_from_path_dest, relative_to_path);
    if (!fs_areSame(src_path, dst_path)) {
        if (!fs.existsSync(dst_path)) {
            execSyncNoCmdTrace("mkdir -p " + dst_path);
        }
        execSyncNoCmdTrace("rm -rf " + dst_path);
        execSyncNoCmdTrace([
            action === "COPY" ? "cp -rp" : "mv",
            src_path,
            dst_path
        ].join(" "));
    }
    else {
        if (action === "MOVE") {
            execSyncNoCmdTrace("rm -r " + src_path);
        }
    }
}
exports.fs_move = fs_move;
/**
 * Download and extract a tarball.
 *
 * Example
 *
 * website.com/rel.tar.gz
 * ./file1.txt
 * ./dir/file2.txt
 *
 * /foo/
 * ./file3.txt
 * ./dir/file4.txt
 *
 * calling with "website.com/rel.tar.gz", "MERGE" will result in:
 *
 * /foo/
 * ./file1.txt
 * ./file3.txt
 * ./dir/file4.txt
 *
 * calling with "website.com/rel.tar.gz", "OVERWRITE IF EXIST" will result in:
 *
 * /foo/
 * ./file1.txt
 * ./dir/file2.txt
 *
 */
function download_and_extract_tarball(url, dest_dir_path, mode) {
    return __awaiter(this, void 0, void 0, function () {
        var e_1, _a, _b, exec, onSuccess, onError, tarball_dir_path, tarball_path, error_3, _c, _d, name;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _b = start_long_running_process("Downloading " + url + " and extracting to " + dest_dir_path), exec = _b.exec, onSuccess = _b.onSuccess, onError = _b.onError;
                    tarball_dir_path = "/tmp/_" + Buffer.from(url, "utf8").toString("hex");
                    tarball_path = tarball_dir_path + ".tar.gz";
                    if (!(fs.existsSync(tarball_dir_path) || fs.existsSync(tarball_path))) return [3 /*break*/, 2];
                    return [4 /*yield*/, exec("rm -rf " + tarball_dir_path + " " + tarball_path)];
                case 1:
                    _e.sent();
                    _e.label = 2;
                case 2:
                    _e.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, web_get(url, tarball_path)];
                case 3:
                    _e.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_3 = _e.sent();
                    onError("Download failed");
                    throw error_3;
                case 5: return [4 /*yield*/, exec("mkdir " + tarball_dir_path)];
                case 6:
                    _e.sent();
                    return [4 /*yield*/, exec("tar -xzf " + tarball_path + " -C " + tarball_dir_path)];
                case 7:
                    _e.sent();
                    return [4 /*yield*/, exec("rm " + tarball_path)];
                case 8:
                    _e.sent();
                    if (!(mode === "MERGE")) return [3 /*break*/, 10];
                    try {
                        for (_c = __values(fs_ls(tarball_dir_path)), _d = _c.next(); !_d.done; _d = _c.next()) {
                            name = _d.value;
                            fs_move("MOVE", tarball_dir_path, dest_dir_path, name);
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    return [4 /*yield*/, exec("rm -r " + tarball_dir_path)];
                case 9:
                    _e.sent();
                    return [3 /*break*/, 11];
                case 10:
                    fs_move("MOVE", tarball_dir_path, dest_dir_path);
                    _e.label = 11;
                case 11:
                    onSuccess();
                    return [2 /*return*/];
            }
        });
    });
}
exports.download_and_extract_tarball = download_and_extract_tarball;
function web_get(url, file_path) {
    if (!url.startsWith("http")) {
        url = "http://" + url;
    }
    if (!!file_path) {
        fs.writeFileSync(file_path, new Buffer(0));
    }
    return new Promise(function (resolve, reject) {
        var get = url.startsWith("https") ? https.get.bind(https) : http.get.bind(http);
        get(url, function (res) {
            if (("" + res.statusCode).startsWith("30")) {
                var url_1 = res.headers.location;
                if (!url_1) {
                    reject(new Error("Missing redirect location"));
                    return;
                }
                web_get(url_1, file_path)
                    .then(function (out) { return resolve(out); })
                    .catch(function (error) { return reject(error); });
                return;
            }
            if (!!file_path) {
                var fsWriteStream = fs.createWriteStream(file_path);
                res.pipe(fsWriteStream);
                fsWriteStream.once("finish", function () { return resolve(); });
                res.once("error", function (error) { return reject(error); });
                fsWriteStream.once("error", function (error) { return reject(error); });
            }
            else {
                var data_1 = new Buffer(0);
                res.on("data", function (chunk) { return data_1 = Buffer.concat([data_1, chunk]); });
                res.once("end", function () { return resolve(data_1.toString("utf8")); });
            }
        }).once("error", function (error) { return reject(error); });
    });
}
exports.web_get = web_get;
function fs_ls(dir_path, mode, showHidden) {
    if (mode === void 0) { mode = "FILENAME"; }
    if (showHidden === void 0) { showHidden = false; }
    return execSyncNoCmdTrace("ls" + (showHidden ? " -a" : ""), { "cwd": dir_path })
        .slice(0, -1)
        .split("\n")
        .map(function (name) { return mode === "ABSOLUTE PATH" ? path.join(dir_path, name) : name; });
}
exports.fs_ls = fs_ls;
/**
 *
 * Create a symbolic link.
 * If dst exist it is removed.
 * directories leading to dest are created if necessary.
 *
 */
function createSymlink(src_path, dst_path) {
    if (!fs.existsSync(dst_path)) {
        execSyncNoCmdTrace("mkdir -p " + dst_path);
    }
    execSyncNoCmdTrace("rm -rf " + dst_path);
    execSync("ln -s " + src_path + " " + dst_path);
}
exports.createSymlink = createSymlink;
/** Create a executable file */
function createScript(file_path, content) {
    if (traceCmdIfEnabled.enabled) {
        console.log("Creating script " + file_path);
    }
    fs.writeFileSync(file_path, Buffer.from(content, "utf8"));
    execSyncNoCmdTrace("chmod +x " + file_path);
}
exports.createScript = createScript;
/**
 *
 * Equivalent to the pattern $() in bash.
 * Strip final LF if present.
 * If cmd fail no error is thrown, an empty string is returned.
 * Does not print to stdout.
 *
 * Typical usage: uname -r or which pkill
 *
 */
function sh_eval(cmd) {
    var res;
    try {
        res = execSyncNoCmdTrace(cmd, { "stdio": "pipe" });
    }
    catch (_a) {
        return "";
    }
    return res.replace(/\n$/, "");
}
exports.sh_eval = sh_eval;
/**
 * Run a command and return true if the return code was 0.
 * Does not print to stdout.
 */
function sh_if(cmd) {
    try {
        execSyncNoCmdTrace(cmd, { "stdio": "pipe" });
    }
    catch (_a) {
        return false;
    }
    return true;
}
exports.sh_if = sh_if;
