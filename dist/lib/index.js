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
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
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
Object.defineProperty(exports, "__esModule", { value: true });
var child_process = require("child_process");
var readline = require("readline");
var fs = require("fs");
var trace = false;
function enableTrace() {
    trace = true;
}
exports.enableTrace = enableTrace;
function traceExec(cmd, options) {
    console.log(colorize("$ " + cmd + " ", "YELLOW") + (!!options ? JSON.stringify(options) + "\n" : ""));
}
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
function execSync(cmd, options) {
    if (trace) {
        traceExec(cmd, options);
    }
    fetch_id(options);
    return child_process.execSync(cmd, __assign({}, (options || {}), { "encoding": "utf8" }));
}
exports.execSync = execSync;
function execSyncTrace(cmd, options) {
    traceExec(cmd, options);
    fetch_id(options);
    child_process.execSync(cmd, __assign({}, (options || {}), { "stdio": "inherit" }));
}
exports.execSyncTrace = execSyncTrace;
function exec(cmd, options) {
    var _this = this;
    if (trace) {
        traceExec(cmd, options);
    }
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
function apt_get_install(package_name, prog) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, onSuccess, exec, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    process.stdout.write("Looking for " + package_name + " ... ");
                    if (!!prog && apt_get_install.doesHaveProg(prog)) {
                        console.log(prog + " executable found. " + colorize("OK", "GREEN"));
                        return [2 /*return*/];
                    }
                    if (apt_get_install.isPkgInstalled(package_name)) {
                        console.log(package_name + " is installed. " + colorize("OK", "GREEN"));
                        return [2 /*return*/];
                    }
                    readline.clearLine(process.stdout, 0);
                    process.stdout.write("\r");
                    _a = start_long_running_process("Installing " + package_name + " package"), onSuccess = _a.onSuccess, exec = _a.exec;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 5, , 6]);
                    if (!apt_get_install.isFirst) return [3 /*break*/, 3];
                    return [4 /*yield*/, exec("apt-get update")];
                case 2:
                    _b.sent();
                    apt_get_install.isFirst = false;
                    _b.label = 3;
                case 3: return [4 /*yield*/, exec("apt-get -y install " + package_name)];
                case 4:
                    _b.sent();
                    return [3 /*break*/, 6];
                case 5:
                    error_2 = _b.sent();
                    apt_get_install.onError(error_2);
                    return [3 /*break*/, 6];
                case 6:
                    apt_get_install.onInstallSuccess(package_name);
                    onSuccess("DONE");
                    return [2 /*return*/];
            }
        });
    });
}
exports.apt_get_install = apt_get_install;
(function (apt_get_install) {
    function record_installed_package(file_json_path, package_name) {
        execSync("touch " + file_json_path);
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
    apt_get_install.isFirst = true;
    function isPkgInstalled(package_name) {
        try {
            console.assert(!!child_process.execSync("dpkg-query -W -f='${Status}' " + package_name + " 2>/dev/null")
                .toString("utf8")
                .match(/^install ok installed$/));
        }
        catch (_a) {
            return false;
        }
        return true;
    }
    apt_get_install.isPkgInstalled = isPkgInstalled;
    function doesHaveProg(prog) {
        try {
            child_process.execSync("which " + prog);
        }
        catch (_a) {
            return false;
        }
        return true;
    }
    apt_get_install.doesHaveProg = doesHaveProg;
})(apt_get_install = exports.apt_get_install || (exports.apt_get_install = {}));
function exit_if_not_root() {
    if (process.getuid() !== 0) {
        console.log("Error: This script require root privilege");
        process.exit(1);
    }
}
exports.exit_if_not_root = exit_if_not_root;
