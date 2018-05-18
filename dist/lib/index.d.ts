/// <reference types="node" />
import * as child_process from "child_process";
export declare function enableTrace(): void;
export declare function colorize(str: string, color: "GREEN" | "RED" | "YELLOW"): string;
export declare function execSync(cmd: string, options?: child_process.ExecSyncOptions & {
    unix_user?: string;
}): string;
export declare function execSyncTrace(cmd: string, options?: child_process.ExecSyncOptions & {
    unix_user?: string;
}): void;
export declare function exec(cmd: string, options?: child_process.ExecOptions & {
    unix_user?: string;
}): Promise<string>;
export declare function start_long_running_process(message: string): {
    onError(errorMessage: string): void;
    onSuccess(message?: string): void;
    exec: typeof exec;
};
export declare function apt_get_install(package_name: string, prog?: string): Promise<void>;
export declare namespace apt_get_install {
    function record_installed_package(file_json_path: string, package_name: string): void;
    let onError: (error: Error) => never;
    let onInstallSuccess: (package_name: string) => void;
    let isFirst: boolean;
    function isPkgInstalled(package_name: string): boolean;
    function doesHaveProg(prog: string): boolean;
}
export declare function exit_if_not_root(): void;
