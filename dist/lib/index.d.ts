/// <reference types="node" />
import * as child_process from "child_process";
/**
 * After this function is called every call to execSync
 * or exec will print the unix commands being executed.
 * */
export declare function enableTrace(): void;
export declare function colorize(str: string, color: "GREEN" | "RED" | "YELLOW"): string;
/**
 *
 * The stderr is forwarded to the console realtime.
 *
 * The returned value is the concatenated data received on stdout.
 *
 * If the return code of the cmd is not 0 an exception is thrown
 * and the message cmd + the concatenated data received on stderr.
 *
 */
export declare function execSync(cmd: string, options?: child_process.ExecSyncOptions & {
    unix_user?: string;
}): string;
/**
 * The cmd is printed before execution
 * stdout and stderr are forwarded to the console realtime.
 * Return nothing.
 *
 * stdio is set to "inherit" and thus should not be redefined.
 *
 */
export declare function execSyncTrace(cmd: string, options?: child_process.ExecSyncOptions & {
    unix_user?: string;
}): void;
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
export declare function execSyncQuiet(cmd: string, options?: child_process.ExecSyncOptions & {
    unix_user?: string;
}): string;
/** Same as execSync but async */
export declare function exec(cmd: string, options?: child_process.ExecOptions & {
    unix_user?: string;
}): Promise<string>;
export declare function start_long_running_process(message: string): {
    onError(errorMessage: string): void;
    onSuccess(message?: string): void;
    exec: typeof exec;
};
export declare function apt_get_install_if_missing(package_name: string, prog?: string): Promise<void>;
export declare namespace apt_get_install_if_missing {
    function isPkgInstalled(package_name: string): boolean;
    function doesHaveProg(prog: string): boolean;
}
export declare function apt_get_install(package_name: string): Promise<void>;
export declare namespace apt_get_install {
    let isFirst: boolean;
    function record_installed_package(file_json_path: string, package_name: string): void;
    let onError: (error: Error) => never;
    let onInstallSuccess: (package_name: string) => void;
}
export declare function exit_if_not_root(): void;
