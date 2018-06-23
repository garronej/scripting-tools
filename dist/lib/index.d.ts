/// <reference types="node" />
import * as child_process from "child_process";
/**
 * After this function is called every call to execSync
 * or exec will print the unix commands being executed.
 * */
export declare function enableCmdTrace(): void;
export declare function get_uid(unix_user: string): number;
export declare function get_gid(unix_user: string): number;
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
 * If enableTrace() have been called the command called will be printed.
 *
 */
export declare function execSync(cmd: string, options?: child_process.ExecSyncOptions): string;
/**
 *
 * The cmd is printed before execution
 * stdout and stderr are forwarded to the console realtime.
 * Return nothing.
 *
 * stdio is set to "inherit" and thus should not be redefined.
 *
 */
export declare function execSyncTrace(cmd: string, options?: child_process.ExecSyncOptions): void;
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
export declare function execSyncQuiet(cmd: string, options?: child_process.ExecSyncOptions): string;
/** Same as execSync but async */
export declare function exec(cmd: string, options?: child_process.ExecOptions): Promise<string>;
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
export declare function start_long_running_process(message: string): {
    exec: typeof exec;
    onSuccess(message?: string): void;
    onError(errorMessage: string): void;
};
/**
 * Apt package if not already installed,
 * if prog is provided and prog is in the PATH the package will not be installed
 * */
export declare function apt_get_install_if_missing(package_name: string, prog?: string): Promise<void>;
export declare namespace apt_get_install_if_missing {
    function isPkgInstalled(package_name: string): boolean;
    function doesHaveProg(prog: string): boolean;
}
/** Install or upgrade package via APT */
export declare function apt_get_install(package_name: string): Promise<void>;
export declare namespace apt_get_install {
    let isFirst: boolean;
    function record_installed_package(file_json_path: string, package_name: string): void;
    let onError: (error: Error) => never;
    let onInstallSuccess: (package_name: string) => void;
}
export declare function exit_if_not_root(): void;
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
export declare function find_module_path(module_name: string, module_dir_path: string): string;
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
export declare function fs_areSame(relative_from_path1: string, relative_from_path2: string, relative_to_path?: string): boolean;
export declare namespace fs_areSame {
    function get_relative_to_path(dir_path1: string, dir_path2: string, to_path: string): string;
}
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
export declare function fs_move(action: "COPY" | "MOVE", relative_from_path_src: string, relative_from_path_dest: string, relative_to_path?: string): void;
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
export declare function download_and_extract_tarball(url: string, dest_dir_path: string, mode: "MERGE" | "OVERWRITE IF EXIST"): Promise<void>;
export declare function web_get(url: string, file_path: string): Promise<void>;
export declare function web_get(url: string): Promise<string>;
export declare function fs_ls(dir_path: string, mode?: "FILENAME" | "ABSOLUTE PATH", showHidden?: boolean): string[];
/**
 *
 * Create a symbolic link.
 * If dst exist it is removed.
 * directories leading to dest are created if necessary.
 *
 */
export declare function createSymlink(src_path: string, dst_path: string): void;
/** Create a executable file */
export declare function createScript(file_path: string, content: string): void;
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
export declare function sh_eval(cmd: string): string;
/**
 * Run a command and return true if the return code was 0.
 * Does not print to stdout.
 */
export declare function sh_if(cmd: string): boolean;
/**
 *
 * Allow to schedule action to perform before exiting.
 *
 * The action handler will always be called before the process stop
 * unless process.exit is explicitly called or if the process receive any signal other
 * than the ones specified in the ExitCause.Signal["signal"] type.
 *
 * The process may stop for tree reasons:
 * 1) If there is no more work scheduled.
 * 2) If an uncaught exception it thrown ( or a unhandled promise rejection )
 * 3) If a signal ( one of the supported )is sent to the process.
 *
 * To manually exit the process there is two option:
 * - Call process.exit() but action handler will never be called.
 * - Emit "beforeExit" on process object ( process.emit("beforeExit, NaN);
 * Doing so you simulate stop condition N1.
 *
 * To define the return code set process.exitCode. The exit code can be set
 * before emitting "beforeExit" or in the action handler.
 *
 * action can be synchronous or asynchronous.
 * the action handler has [timeout] ms to complete.
 * If it has not completed within this delay the process will
 * be terminated anyway.
 *
 * Any uncaught exception thrown outside of the action handler
 * while the action handler is running will be ignored.
 *
 * Whether the action handler complete by successfully or throw
 * an exception the process will terminate with exit code set
 * in process.exitCode at the time of the completion.
 *
 * (optional) if exitOnCause(exitCause) return false the action handler
 * will not be called and the the process will continue as
 * if nothing happened.
 *
 *
 */
export declare function setExitHandler(action: (exitCause: setExitHandler.ExitCause) => any, timeout?: number, exitOnCause?: (exitCause: Exclude<setExitHandler.ExitCause, setExitHandler.ExitCause.NothingElseToDo>) => boolean): void;
export declare namespace setExitHandler {
    type ExitCause = ExitCause.Signal | ExitCause.Exception | ExitCause.NothingElseToDo;
    namespace ExitCause {
        type Signal = {
            type: "SIGNAL";
            signal: keyof typeof Signal._obj;
        };
        namespace Signal {
            const _obj: {
                "SIGINT": null;
                "SIGUSR2": null;
            };
            const list: Signal["signal"][];
        }
        type Exception = {
            type: "EXCEPTION";
            error: Error;
        };
        type NothingElseToDo = {
            type: "NOTHING ELSE TO DO";
        };
    }
    let log: typeof console.log;
}
