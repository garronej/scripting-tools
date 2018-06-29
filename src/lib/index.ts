import * as child_process from "child_process";
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";
import * as util from "util";
import * as os from "os";

/** 
 * After this function is called every call to execSync 
 * or exec will print the unix commands being executed. 
 * */
export function enableCmdTrace(): void {
    traceCmdIfEnabled.enabled= true;
}

function traceCmdIfEnabled(cmd: string, options: any){

    if( !traceCmdIfEnabled.enabled ){
        return;
    }

    console.log(
        colorize(`$ ${cmd} `, "YELLOW") + (!!options?`${JSON.stringify(options)}\n`:"")
    );

}

namespace traceCmdIfEnabled {
    export let enabled = false;
}


export function get_uid(unix_user: string){
    return parseInt(sh_eval(`id -u ${unix_user}`));
}

export function get_gid(unix_user: string){
    return parseInt(sh_eval(`id -g ${unix_user}`));
}


export function colorize(str: string, color: "GREEN" | "RED" | "YELLOW"): string {

    let color_code = (() => {

        switch (color) {
            case "GREEN": return "\x1b[32m";
            case "RED": return "\x1b[31m";
            case "YELLOW": return "\x1b[33m";
        }

    })();

    return `${color_code}${str}\x1b[0m`;

}

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
export function execSync(
    cmd: string,
    options?: child_process.ExecSyncOptions,
): string {

    traceCmdIfEnabled(cmd, options);

    return child_process.execSync(cmd, { ...(options || {}), "encoding": "utf8" });

}

/** 
 * 
 * The cmd is printed before execution
 * stdout and stderr are forwarded to the console realtime.
 * Return nothing.
 * 
 * stdio is set to "inherit" and thus should not be redefined.
 * 
 */
export function execSyncTrace(
    cmd: string, 
    options?: child_process.ExecSyncOptions,
): void {

    traceCmdIfEnabled(cmd, options);

    child_process.execSync(cmd, { ...(options || {}), "stdio": "inherit" });

}

/** Same as execSync except that it dose not print cmd even if cmdTrace have been enabled */
const execSyncNoCmdTrace: typeof execSync = (...args)=> {

    const enabled_back = traceCmdIfEnabled.enabled;

    traceCmdIfEnabled.enabled = false;

    try{

        const out= execSync.apply(null, args);

        traceCmdIfEnabled.enabled = enabled_back;

        return out;

    }catch(error){

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
export function execSyncQuiet(
    cmd: string,
    options?: child_process.ExecSyncOptions,
): string{

    return execSync(cmd, { ...(options || {}), "stdio": "pipe" });

}


/** Same as execSync but async */
export function exec(
    cmd: string,
    options?: child_process.ExecOptions
): Promise<string> {

    traceCmdIfEnabled(cmd, options);

    return new Promise(
        async (resolve, reject) => {

            child_process.exec(
                cmd,
                { ...(options || {}), "encoding": "utf8" },
                (error, stdout, stderr) => {

                    if (!!error) {

                        error["stderr"] = stderr;

                        reject(error);

                    } else {

                        resolve(stdout as any);

                    }


                }
            );

        }
    );

}

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
export function start_long_running_process(message: string): {
    exec: typeof exec;
    onSuccess(message?: string): void;
    onError(errorMessage: string): void;
} {

    process.stdout.write(`${message}... `);

    const moveBack = (() => {

        let cp = message.length + 3;

        return () => readline.cursorTo(process.stdout, cp);

    })();

    let p = ["\\", "|", "/", "-"].map(i => colorize(i, "GREEN"));

    let x = 0;

    let timer = setInterval(() => {

        moveBack();

        process.stdout.write(p[x++]);

        x = x % p.length;

    }, 250);

    let onComplete = (message: string) => {

        clearInterval(timer);

        moveBack();

        process.stdout.write(`${message}\n`);

    };

    const onError = errorMessage => onComplete(colorize(errorMessage, "RED"));
    const onSuccess = message => onComplete(colorize(message || "ok", "GREEN"));

    if (traceCmdIfEnabled.enabled) {

        onComplete("");

        onComplete = message => console.log(message);

    }

    return {
        onError,
        onSuccess,
        "exec": async function (...args) {

            try {

                return await exec.apply(null, args);

            } catch (error) {

                onError(error.message);

                throw error;

            }

        }
    };

};

/** 
 * Apt package if not already installed, 
 * if prog is provided and prog is in the PATH the package will not be installed
 * */
export async function apt_get_install_if_missing(
    package_name: string,
    prog?: string
) {

    process.stdout.write(`Looking for ${package_name} ... `);


    if (!!prog && apt_get_install_if_missing.doesHaveProg(prog)) {

        console.log(`${prog} executable found. ${colorize("OK", "GREEN")}`);

        return;

    }

    if (apt_get_install_if_missing.isPkgInstalled(package_name)) {

        console.log(`${package_name} is installed. ${colorize("OK", "GREEN")}`);

        return;

    }

    readline.clearLine(process.stdout, 0);
    process.stdout.write("\r");

    return await apt_get_install(package_name);


}

export namespace apt_get_install_if_missing {

    export function isPkgInstalled(package_name: string): boolean {

        try {

            console.assert(
                !!execSyncNoCmdTrace(`dpkg-query -W -f='\${Status}' ${package_name}`, { "stdio": "pipe" })
                    .match(/^install ok installed$/)
            );

        } catch{

            return false;

        }

        return true;

    }

    export function doesHaveProg(prog: string): boolean {

        try {

            execSyncNoCmdTrace(`which ${prog}`);

        } catch{

            return false;

        }

        return true;

    }

}

/** Install or upgrade package via APT */
export async function apt_get_install(package_name: string) {

    const { onSuccess, exec } = start_long_running_process(`Installing or upgrading ${package_name} package`);

    try {

        if (apt_get_install.isFirst) {

            await exec("apt-get update");

            apt_get_install.isFirst = false;

        }

        const was_installed_before = apt_get_install_if_missing.isPkgInstalled(package_name);

        await exec(`apt-get -y install ${package_name}`);

        if (!was_installed_before) {

            apt_get_install.onInstallSuccess(package_name);

        }

    } catch (error) {

        apt_get_install.onError(error);

    }

    onSuccess("DONE");

}

export namespace apt_get_install {

    export let isFirst = true;

    export function record_installed_package(
        file_json_path: string,
        package_name: string
    ): void {

        execSyncNoCmdTrace(`touch ${file_json_path}`);

        const raw = fs.readFileSync(file_json_path).toString("utf8");

        const list: string[] = raw === "" ? [] : JSON.parse(raw);

        if (!list.find(p => p === package_name)) {

            list.push(package_name);

            fs.writeFileSync(
                file_json_path,
                Buffer.from(JSON.stringify(list, null, 2), "utf8")
            );

        }

    }

    export let onError = (error: Error) => { throw error };

    export let onInstallSuccess = (package_name: string): void => { };

}

export function exit_if_not_root(): void {
    if (process.getuid() !== 0) {

        console.log(colorize("Error: root privilege required ", "RED"));

        process.exit(1);

    }
}

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
export function find_module_path(
    module_name: string,
    module_dir_path: string
): string {

    const cmd = [
        `find ${path.join(module_dir_path, "node_modules")}`,
        `-type f`,
        `-path \\*/node_modules/${module_name}/package.json`,
        `-exec dirname {} \\;`
    ].join(" ");

    const match = execSyncNoCmdTrace(cmd, { "stdio": "pipe" }).slice(0, -1).split("\n");

    if (!match.length) {
        throw new Error(`${module_name} not found in ${module_dir_path}`);
    } else {
        return match.sort((a, b) => a.length - b.length)[0];
    }

}

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
export function fs_areSame(
    relative_from_path1: string,
    relative_from_path2: string,
    relative_to_path: string = "."
): boolean {

    relative_to_path= fs_areSame.get_relative_to_path(
        relative_from_path1, relative_from_path2, relative_to_path
    );

    try {

        execSyncNoCmdTrace([
            "diff -r",
            path.join(relative_from_path1, relative_to_path),
            path.join(relative_from_path2, relative_to_path)
        ].join(" "),
            { "stdio": "pipe" }
        );

    } catch{

        return false;

    }

    return true;

}

export namespace fs_areSame {

    export function get_relative_to_path(
        dir_path1: string,
        dir_path2: string,
        to_path: string
    ): string {

        if (path.isAbsolute(to_path)) {

            const dir_path = [dir_path1, dir_path2]
                .filter(v => to_path.startsWith(v))
                .sort((a, b) => b.length - a.length)[0];

            if (!dir_path) {
                throw new Error("Not relative!");
            }

            return path.relative(dir_path, to_path);

        } else {

            return to_path;

        }

    }

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
export function fs_move(
    action: "COPY" | "MOVE",
    relative_from_path_src: string,
    relative_from_path_dest: string,
    relative_to_path: string = "."
) {

    relative_to_path = fs_areSame.get_relative_to_path(
        relative_from_path_src, relative_from_path_dest, relative_to_path
    );

    const src_path = path.join(relative_from_path_src, relative_to_path);
    const dst_path = path.join(relative_from_path_dest, relative_to_path);

    if (!fs_areSame(src_path, dst_path)) {

        if (!fs.existsSync(dst_path)) {
            execSyncNoCmdTrace(`mkdir -p ${dst_path}`);
        }

        execSyncNoCmdTrace(`rm -rf ${dst_path}`);

        execSyncNoCmdTrace([
            action === "COPY" ? "cp -rp" : "mv",
            src_path,
            dst_path
        ].join(" "));

    } else {

        if (action === "MOVE") {
            execSyncNoCmdTrace(`rm -r ${src_path}`);
        }

    }



}

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
export async function download_and_extract_tarball(
    url: string,
    dest_dir_path: string,
    mode: "MERGE" | "OVERWRITE IF EXIST"
) {

    const { exec, onSuccess, onError } = start_long_running_process(`Downloading ${url} and extracting to ${dest_dir_path}`);

    const tarball_dir_path = `/tmp/_${Buffer.from(url,"utf8").toString("hex")}`;
    const tarball_path = `${tarball_dir_path}.tar.gz`;

    if( fs.existsSync(tarball_dir_path) || fs.existsSync(tarball_path) ){

        await exec(`rm -rf ${tarball_dir_path} ${tarball_path}`);

    }

    //execSyncNoCmdTrace(`wget -nc ${url} -q -O ${tarball_path}`);

    try{

        await web_get(url, tarball_path);

    }catch(error){

        onError("Download failed");
        throw error;

    }

    await exec(`mkdir ${tarball_dir_path}`);

    await exec(`tar -xzf ${tarball_path} -C ${tarball_dir_path}`);

    await exec(`rm ${tarball_path}`);

    if (mode === "MERGE") {

        for (const name of fs_ls(tarball_dir_path)) {

            fs_move("MOVE", tarball_dir_path, dest_dir_path, name);

        }

        await exec(`rm -r ${tarball_dir_path}`);

    } else {

        fs_move("MOVE", tarball_dir_path, dest_dir_path);

    }

    onSuccess();

}


export function web_get(url: string, file_path: string): Promise<void>;
export function web_get(url: string): Promise<string>;
export function web_get(url: string, file_path?: string): Promise<string | void> {

    if( !url.startsWith("http") ){
        url= `http://${url}`;
    }

    if (!!file_path) {
        fs.writeFileSync(file_path, new Buffer(0));
    }

    return new Promise(
        (resolve, reject) => {

            const get: typeof https.get= url.startsWith("https")?https.get.bind(https):http.get.bind(http);

            get(url, res => {

                if ( `${res.statusCode}`.startsWith("30") ) {

                    const { location: url } = res.headers;

                    if( !url ){
                        reject(new Error("Missing redirect location"));
                        return;
                    }

                    web_get(url, file_path!)
                        .then(out => resolve(out))
                        .catch(error => reject(error));

                    return;

                }

                if (!!file_path) {

                    const fsWriteStream= fs.createWriteStream(file_path);

                    res.pipe(fsWriteStream);

                    fsWriteStream.once("finish", ()=> resolve());

                    res.once("error", error => reject(error));

                    fsWriteStream.once("error", error=> reject(error));

                } else {

                    let data = new Buffer(0);

                    res.on("data", (chunk: Buffer) => data = Buffer.concat([data, chunk]));

                    res.once("end", () => resolve(data.toString("utf8")));

                }


            }).once("error", error => reject(error));

        }
    );

}

export function fs_ls(
    dir_path: string,
    mode: "FILENAME" | "ABSOLUTE PATH" = "FILENAME",
    showHidden = false
): string[] {

    return execSyncNoCmdTrace(`ls${showHidden ? " -a" : ""}`, { "cwd": dir_path })
        .slice(0, -1)
        .split("\n")
        .map(name => mode === "ABSOLUTE PATH" ? path.join(dir_path, name) : name);

}

/**
 * 
 * Create a symbolic link.
 * If dst exist it is removed.
 * directories leading to dest are created if necessary.
 * 
 */
export function createSymlink(
    src_path: string,
    dst_path: string
) {

    if (!fs.existsSync(dst_path)) {
        execSyncNoCmdTrace(`mkdir -p ${dst_path}`);
    }

    execSyncNoCmdTrace(`rm -rf ${dst_path}`);

    execSync(`ln -s ${src_path} ${dst_path}`);

}

/** Create a executable file */
export function createScript(
    file_path: string, content: string
) {

    if (traceCmdIfEnabled.enabled) {
        console.log(`Creating script ${file_path}`);
    }

    fs.writeFileSync(file_path, Buffer.from(content, "utf8"));

    execSyncNoCmdTrace(`chmod +x ${file_path}`);

}



export namespace unixUser {

    export function create(unix_user: string, home_dir_path: string= "/tmp") {

        execSyncNoCmdTrace(`useradd -M ${unix_user} -s /bin/false -d ${home_dir_path}`);

    }

    export function remove(unix_user: string) {

        execSyncNoCmdTrace(`userdel ${unix_user}`, { "stdio": "pipe" });

    }

}

export { get_caller_file_path } from "./get_caller_file_path";
import { get_caller_file_path } from "./get_caller_file_path";

/**
 * 
 * DO NOT USE TEST PURPOSE ONLY
 * 
 * return __filename
 * 
 */
export function get__filename(): string {
    return get_caller_file_path();
}

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
export function sh_eval(cmd: string): string {

    let res: string;

    try {

        res = execSyncNoCmdTrace(cmd, { "stdio": "pipe" })

    } catch{

        return "";

    }

    return res.replace(/\n$/, "");

}

/**
 * Run a command and return true if the return code was 0.
 * Does not print to stdout.
 */
export function sh_if(cmd: string): boolean {

    try {

        execSyncNoCmdTrace(cmd, { "stdio": "pipe" });

    } catch{

        return false;

    }

    return true;

}


/**
 * 
 * Allow to schedule action function to perform before exiting.
 * 
 * The task function will always be called before the process stop
 * unless process.exit is explicitly called somewhere or 
 * if the process receive any signal other * than the ones specified 
 * in the ExitCause.Signal["signal"] type.
 * 
 * The process may stop for tree reasons: 
 * 1) If there is no more work scheduled ( natural termination ).
 * 2) If an uncaught exception it thrown ( or a unhandled promise rejection )
 * 3) If a signal ( one of the handled ) is sent to the process.
 * 
 * To manually exit the process there is two option:
 * - Call process.exit(X) but the task function will not be called.
 * - Emit "beforeExit" on process object ( process.emit("beforeExit, process.exitCode= X) );
 *  Doing so you simulate 1st stop condition ( natural termination ).
 * 
 * To define the return code set process.exitCode. The exit code can be set
 * before emitting "beforeExit" or in the task function.
 * If exitCode has not be defined the process will exit with 0 if
 * there was nothing else to do and 1 otherwise.
 * 
 * The task function can be synchronous or asynchronous.
 * The task function has [timeout] ms to complete.
 * If it has not completed within this delay the process will
 * be terminated anyway.
 * WARNING: It is important not to perform sync operation that can 
 * hang for a long time in the task function ( e.g. execSync("sleep 1000"); ) 
 * because while the sync operation are performed the timeout can't be triggered.
 * 
 * As soon as the task function is called all the other exitCause that 
 * may auccur will be ignored so that the task function have time to complete.
 * Anyway the task function is called only once.
 *
 * Whether the task function complete by successfully or throw
 * an exception the process will terminate with exit code set 
 * in process.exitCode at the time of the completion.
 * 
 * Provide shouldExitIf function to filter what should be 
 * considered a case to terminate the process.
 * Only exception and supported signals can be bypassed,
 * Nothing else to do will always terminate the process.
 * By default exiting on any signal or uncaught errors.
 *
 */
export function setProcessExitHandler(
    task: (exitCause: setProcessExitHandler.ExitCause) => any,
    timeout = 4000,
    shouldExitIf: (exitCause: Exclude<setProcessExitHandler.ExitCause, setProcessExitHandler.ExitCause.NothingElseToDo>) => boolean = () => true
) {

    const log: typeof setProcessExitHandler.log = (...args) => setProcessExitHandler.log(
        `===exitHandler=== ${util.format.apply(util, args)}`
    );

    let handler: (exitCause: setProcessExitHandler.ExitCause) => any = async exitCause => {

        if (exitCause.type !== "NOTHING ELSE TO DO" && !shouldExitIf(exitCause)) {

            log("Choosing to not terminating the process despite: ", exitCause);

            return;

        }

        handler = exitCause => log("Ignored extra exit cause", exitCause);

        const process_exit = () => {

            if (typeof process.exitCode !== "number" || isNaN(process.exitCode)) {

                process.exitCode = exitCause.type === "NOTHING ELSE TO DO" ? 0 : 1;

            }

            process.exit();

        };

        log("Cause of process termination: ", exitCause);

        setTimeout(() => {
            log("Exit task timeout");
            process_exit();
        }, timeout);

        let actionOut: any;

        try {

            actionOut = task(exitCause);

        } catch (error) {

            log("Exit task thrown error", error);
            process_exit();
            return;

        }

        if (actionOut instanceof Promise) {

            try {

                await actionOut;

            } catch (error) {

                log("Exit task returned a promise that rejected", error);

                process_exit();
                return;

            }

        }

        log("Exit task complete successfully.");

        process_exit();

    };

    for (const signal of setProcessExitHandler.ExitCause.Signal.list) {

        process.on(signal, () => handler({ "type": "SIGNAL", signal }));

    }


    for (const eventName of ["uncaughtException", "unhandledRejection"]) {

        process.on(eventName as any, (error: Error) => handler({ "type": "EXCEPTION", error }));

    }

    process.on("beforeExit", () => handler({ "type": "NOTHING ELSE TO DO" }));

}

export namespace setProcessExitHandler {

    export type ExitCause =
        ExitCause.Signal |
        ExitCause.Exception |
        ExitCause.NothingElseToDo
        ;

    export namespace ExitCause {

        export type Signal = {
            type: "SIGNAL";
            signal: keyof typeof Signal._obj;
        };

        export namespace Signal {

            export const _obj = { "SIGINT": null, "SIGUSR2": null, "SIGHUP": null };

            export const list: Signal["signal"][] = Object.keys(_obj) as any;

        }

        export type Exception = {
            type: "EXCEPTION",
            error: Error
        };

        export type NothingElseToDo = {
            type: "NOTHING ELSE TO DO"
        };

    }

    export let log: typeof console.log = () => { };

}

/**
 * 
 * Stop a process by sending a specific signal.
 * Assume that the given signal is supposed to be deadly for the process.
 * The process is identified by a pid stored in pidfile.
 * 
 * If the pidfile exist but the process identified by pid does not
 * then the pidfile is suppressed. ( Assume write access on pidfile )
 * 
 * The function will hang until the process stop.
 * 
 */
export function stopProcessSync(
    pidfile_path: string,
    signal: NodeJS.Signals = "SIGUSR2"
) {

    const log: typeof setProcessExitHandler.log = (...args) => stopProcessSync.log(
        `===stopProcessSync=== ${util.format.apply(util, args)}`
    );

    log(`Called on pidfile ${pidfile_path}...`);

    if (!stopProcessSync.isRunning(pidfile_path)) {
        log("not running.");
        return;
    }

    log(`Sending signal ${signal}...`);

    execSyncNoCmdTrace(
        stopProcessSync.buildSendSignalCmd(pidfile_path, signal),
        { "stdio": "pipe" }
    );

    let isFirstCheck = true;

    while (stopProcessSync.isRunning(pidfile_path)) {

        if (isFirstCheck) {
            isFirstCheck = false;
        } else {
            log("Waiting for process to terminate.");
        }

        execSyncNoCmdTrace("sleep 0.5", { "stdio": "pipe" });

    }

    log("Process terminated.");

}

export namespace stopProcessSync {


    /** 
     * Shell command to so send a pid signal to a process 
     * Suitable for for systemd ExecStop=
     * */
    export function buildSendSignalCmd(
        pidfile_path: string,
        signal: NodeJS.Signals
    ) {
        return [
            sh_eval("which pkill"),
            `--pidfile ${pidfile_path}`,
            `-${signal}`
        ].join(" ");
    }

    /** 
     * NOTE: Remove pidfile if process does not exist.
     * Assume user have rw access wright one the pidfile.
     * */
    export function isRunning(
        pidfile_path: string
    ): boolean {

        if (!fs.existsSync(pidfile_path)) {
            return false;
        }

        const pid = parseInt(fs.readFileSync(pidfile_path).toString("utf8").replace(/\n$/, ""));

        const doesProcessExist = sh_if(`kill -0 ${pid}`)

        if (!doesProcessExist && fs.existsSync(pidfile_path)) {
            fs.unlinkSync(pidfile_path);
        }

        return doesProcessExist;

    }

    export let log: typeof console.log = () => { };

}

/**
 * 
 * Function to create the entry point (main.js) of a node service that can:
 * -Restart on crash (without relying on systemd to do so).
 * -Execute as specific unix user but can perform tasks as root before start.
 * -Be stopped gracefully by sending USR2 signal on the root process ( identified by pidfile ).
 * -Be started via a shell and gracefully stopped with CTRL-C (INT signal).
 * -Ensure only one instance of the service run at the same time.
 *      ( if at the time the main is called there is an other instance of the service
 *      running it is gracefully terminated )
 * -Ensure that the process will terminate in at most [ stop_timeout ] ms after 
 *      receiving INT or USR2 signal. (default 5second)
 * -Forward daemon processes stdout to root process stdout.
 * -Can fork multiple daemon process.
 * 
 * The root process forward command line arguments and environnement variable to 
 * the daemon processes.
 * 
 * => rootProcess function should return: 
 * -pidfile_path: where to store the pid of the root process.
 *      take to terminate after requested to exit gracefully.
 * -stop_timeout: The maximum amount of time ( in ms ) the the root process 
 *      is allowed to take for terminating. Defaults to 5000ms.
 * -assert_unix_user: enforce that the main be called by a specific user.
 * -isQuiet?: set to true to disable root process debug info logging on stdout. ( default false )
 * -doForwardDaemonStdout?: set to true to forward everything the daemon 
 *      process write to stdout to the root process stdout. ( default true )
 * -daemon_unix_user?: User who should own the daemon process. 
 * -daemon_node_path?: Node.js executable that should be used to by the daemon process.
 * -daemon_cwd?: working directory of the daemon process.
 * -daemon_restart_after_crash_delay?: ( Default to 500ms. )Delay in ms before restarting the daemon
 *      after it terminate without being requested to. If set to a negative number the daemons 
 *      will not be restarted after it terminate for the first time and :
 *      If a daemon process exited with 0 and there is no other daemon process the root process
 *      will end with a clean exit code. 
 *      If any of the daemon exit with an unclean code the root process will be terminated with an error code
 *      even if there is some other daemon running.
 * -daemon_count: Number of instance of daemon process that should be forked, default 1.
 * -preForkTask: Task to perform before forking a daemon process.
 *      It is called just before forking the daemon process. ( called again on every restart. )
 *      If the function is async the daemon will not be forked until the returned promise resolve.
 *      If the function throw exception root process will exit with code 1.
 *      (pidfile will be deleted)
 *      If the function is async and if it need to spawn child processes then 
 *      an implementation for terminateSubProcess ( passed as reference ) should be provided so that 
 *      if when called it kill all the child processes then resolve once they are terminated.
 *      The to which the promise resolve will be used as exit code for the root process.
 *      Note that terminateSubProcess should never be called, it is a OUT parameter.
 * 
 * => daemonProcess
 * It should return: 
 * -launch: the function that the daemon process need to call to start the actual job that the service is meant to perform.
 * -beforeExitTask: function that should be called before the daemon process exit. ( e.g. creating crash report ).
 *      If the daemon process is terminating due to an error the error will be passed as argument.
 *      There is two scenario that will led to this function NOT being called:
 *      1)The daemon process receive KILL or other deadly signal that can't be overridden.
 *      2)The root process terminate.
 * daemon_number represent the instance index of the daemon among the total of [damon_count] process forked.
 * It can be user to use a different logfile for each daemon process instance.
 * 
 * NOTE: If the root process receive a deadly signal other than INT, USR2 or HUP
 * ( e.g. KILL or STOP ) the root and daemon processes will immediately terminate without 
 * executing beforeExit tasks or removing pidfile.
 * 
 * NOTE: because setting listener on "message" and "disconnect" process event prevent the 
 * thread from terminating naturally where is nothing more to do if you wish to manually
 * terminate the daemon process without termination being requested from the parent you can:
 *        1) emit "beforeExit" on process setting the desired exit code ( process.emit("beforeExit", process.exitCode= X);
 *        2) throw an exception.
 * 
 * If once of the daemon process is crashing over and over again the root process will eventually
 * be terminated to prevent waisting host resources.
 * 
 */
export function createService(params: {
    rootProcess(): Promise<{
        pidfile_path: string;
        stop_timeout?: number;
        assert_unix_user?: string;
        isQuiet?: boolean;
        doForwardDaemonStdout?: boolean;
        daemon_unix_user?: string;
        daemon_node_path?: string;
        daemon_cwd?: string;
        daemon_restart_after_crash_delay?: number;
        daemon_count?: number;
        preForkTask?: (
            terminateChildProcesses: { impl: () => Promise<void>; },
            daemon_number: number
        ) => Promise<void> | void;
    }>,
    daemonProcess(daemon_number: number, daemon_count: number): Promise<{
        launch: ()=> any;
        beforeExitTask?: (error: Error | undefined) => Promise<void>;
    }>,
}) {

    const max_consecutive_restart = 300;

    const {
        rootProcess,
        daemonProcess,
    } = params;

    const main_root = async (main_js_path: string) => {

        const {
            pidfile_path,
            stop_timeout: _stop_timeout,
            assert_unix_user,
            isQuiet,
            doForwardDaemonStdout: _doForwardDaemonStdout,
            daemon_unix_user,
            daemon_node_path,
            daemon_cwd,
            daemon_restart_after_crash_delay: _daemon_restart_after_crash_delay,
            preForkTask,
            daemon_count: _daemon_count
        } = await rootProcess();

        const stop_timeout =
            _stop_timeout !== undefined ?
                _stop_timeout : 5000;

        const doForwardDaemonStdout =
            _doForwardDaemonStdout !== undefined ?
                _doForwardDaemonStdout : true;

        const daemon_restart_after_crash_delay =
            _daemon_restart_after_crash_delay !== undefined ?
                _daemon_restart_after_crash_delay : 500;

        const daemon_count =
            _daemon_count !== undefined ?
                _daemon_count : 1;

        if( assert_unix_user !== undefined && os.userInfo().username !== assert_unix_user ){

            console.log(colorize(`Must be run as ${assert_unix_user}`, "RED"));

            process.exit(1);

            return;

        }

        const log: typeof console.log = !isQuiet ?
            ((...args) => process.stdout.write(
                Buffer.from(`(root process) ${util.format.apply(util, args)}\n`, "utf8")
            )) :
            (() => { });


        stopProcessSync.log = log;

        stopProcessSync(pidfile_path, "SIGUSR2");

        if (fs.existsSync(pidfile_path)) {
            throw Error("Other instance launched simultaneously");
        }

        (function createPidfile() {

            const pidfile_dir_path = path.dirname(pidfile_path);

            if (!fs.existsSync(pidfile_dir_path)) {
                execSyncNoCmdTrace(`mkdir -p ${pidfile_dir_path}`);
            }

            fs.writeFileSync(pidfile_path, process.pid.toString());

        })()

        log(`PID: ${process.pid}`);

        type DaemonContext = {
            daemonProcess: child_process.ChildProcess | undefined;
            terminatePreForkChildProcesses: ({ impl: () => Promise<void>; })
            restart_attempt_remaining: number;
            reset_restart_attempt_timer: NodeJS.Timer;
        };

        const daemonContexts = new Map<number, DaemonContext>(
            (new Array<[number, DaemonContext]>(daemon_count))
                .fill(null as any)
                .map((_, index) => {

                    const context: [number, DaemonContext] = [
                        index + 1,
                        {
                            "daemonProcess": undefined,
                            "terminatePreForkChildProcesses": { "impl": () => Promise.resolve() },
                            "restart_attempt_remaining": max_consecutive_restart,
                            "reset_restart_attempt_timer": setTimeout(() => { }, 0)
                        }
                    ];

                    return context;

                })
        );

        let isTerminating = false;

        setProcessExitHandler(async exitCause => {

            isTerminating = true;

            const childProcessExitCode = await (async function terminateAllChildProcesses(): Promise<number> {

                const terminateDaemonProcess = async (daemonProcess: child_process.ChildProcess) => new Promise<number>(resolve => {

                    log("Attempt to gracefully terminate daemon process...");

                    daemonProcess.send(null);

                    let isKilled = false;

                    const timer = setTimeout(() => {

                        isKilled = true;

                        log("Daemon process not responding, sending KILL signal...");

                        daemonProcess.kill("SIGKILL")

                    }, (9 / 10) * stop_timeout);

                    const onTerminate = (childProcessExitCode: number): void => {

                        log(`Daemon process exited with code ${childProcessExitCode}`);

                        clearTimeout(timer);

                        resolve(childProcessExitCode);

                    };

                    daemonProcess.once("close", (childProcessExitCode: number | null) => {

                        if (typeof childProcessExitCode !== "number" || isNaN(childProcessExitCode)) {
                            childProcessExitCode = isKilled ? 1 : 0;
                        }

                        onTerminate(childProcessExitCode);

                    });

                    daemonProcess.once("error", () => onTerminate(1));

                });

                const terminatePreForkChildProcessesSafeCall = (impl: () => Promise<void>): Promise<"SUCCESS" | "TIMEOUT" | "ERROR"> => {

                    let timer: NodeJS.Timer;

                    return Promise.race([
                        new Promise<"TIMEOUT">(
                            resolve => timer = setTimeout(
                                () => resolve("TIMEOUT"),
                                (16 / 17) * stop_timeout
                            )
                        ),
                        (async () => {

                            let result: "SUCCESS" | "ERROR";

                            try {

                                await impl();

                                result = "SUCCESS";

                            } catch{

                                result = "ERROR";

                            }

                            clearTimeout(timer!);

                            return result;

                        })()
                    ]);

                };


                const tasks: Promise<number>[] = [];

                for (const { daemonProcess, terminatePreForkChildProcesses } of daemonContexts.values()) {

                    tasks[tasks.length] = !daemonProcess ? (
                        new Promise<number>(
                            resolve => terminatePreForkChildProcessesSafeCall(terminatePreForkChildProcesses.impl!)
                                .then(result => result === "SUCCESS" ? resolve(0) : resolve(1))
                        )
                    ) : terminateDaemonProcess(daemonProcess);

                }

                return (await Promise.all(tasks)).reduce(
                    (accumulator, currentValue) => accumulator === 0 ? currentValue : accumulator,
                    0
                );


            })();


            if (exitCause.type === "EXCEPTION") {
                /*
                 preForkTask throw or daemonProcess emit error or 
                 one of the daemon exited with a non 0 code and 
                 restart_delay was set <0 
                */

                log(`Root process exception message: ${exitCause.error.message}`);

                process.exitCode = 1;

            } else {

                process.exitCode = childProcessExitCode;

            }

            fs.unlinkSync(pidfile_path);

            log("pidfile deleted");

        }, stop_timeout);

        setProcessExitHandler.log = log;

        const args = (() => {

            const out = [...process.argv];

            out.shift();
            out.shift();

            return out;

        })();

        const makeForkOptions = (daemon_number): child_process.ForkOptions => ({
            "uid": daemon_unix_user ? get_uid(daemon_unix_user) : undefined,
            "gid": daemon_unix_user ? get_gid(daemon_unix_user) : undefined,
            "silent": true,
            "cwd": daemon_cwd,
            "execPath": daemon_node_path,
            "env": { ...process.env, daemon_number, daemon_count, stop_timeout }
        });

        const forkDaemon = async (daemon_number: number) => {

            const context = daemonContexts.get(daemon_number)!;

            clearTimeout(context.reset_restart_attempt_timer);

            if (!!preForkTask) {

                log(`performing pre fork tasks for daemon number ${daemon_number}...`);

                try {

                    await preForkTask(
                        context.terminatePreForkChildProcesses,
                        daemon_number
                    );

                } catch (error) {

                    log(`PreFork tasks for daemon number ${daemon_number} raised an exception`);

                    throw error;

                }

                context.terminatePreForkChildProcesses.impl = () => Promise.resolve();

            }

            if (isTerminating) {
                return;
            }

            context.reset_restart_attempt_timer = setTimeout(
                () => context.restart_attempt_remaining = max_consecutive_restart,
                10000
            );

            log(`Forking daemon process number ${daemon_number} now.`);

            const daemonProcess = child_process.fork(
                main_js_path,
                args,
                makeForkOptions(daemon_number)
            );

            context.daemonProcess = daemonProcess;

            if (doForwardDaemonStdout) {

                daemonProcess.stdout.on("data", data =>
                    process.stdout.write(data)
                );

            }

            daemonProcess.once("error", error => {

                if (isTerminating) {
                    return;
                }

                context.daemonProcess = undefined;

                log([
                    `Error evt emitted by daemon process number ${daemon_number}`,
                    `Meaning that: `,
                    `The process could not be spawned, or`,
                    `The process could not be killed, or`,
                    `Sending a message to the child process failed.`
                ].join("\n"));


                throw error;

            });

            daemonProcess.once("close", (childProcessExitCode: number | null) => {

                if (isTerminating) {
                    return;
                }

                context.daemonProcess = undefined;

                log(`Daemon process ${daemon_number} exited without being requested to.`);

                if (daemon_restart_after_crash_delay < 0) {

                    if (childProcessExitCode === null) {
                        childProcessExitCode = 1;
                    }

                    log(`Daemon number ${daemon_number} will not be restarted.`);

                    clearTimeout(context.reset_restart_attempt_timer);

                    if (childProcessExitCode !== 0) {

                        throw new Error(`Daemon number ${daemon_number}, crashed`);

                    } else if (!Array.from(daemonContexts.values()).find(({ daemonProcess }) => !!daemonProcess)) {

                        log(`As last remaining daemon process terminated cleanly we stop end root process`);

                        process.emit("beforeExit", NaN);

                    }

                    return;

                }

                if (context.restart_attempt_remaining-- === 0) {

                    throw new Error(`Daemon process ${daemon_number} is crashing over and over`);

                }

                log(`Daemon process ${daemon_number} will be restarted ( attempt remaining: ${context.restart_attempt_remaining} )`);

                setTimeout(() => forkDaemon(daemon_number), daemon_restart_after_crash_delay);

            });

        };

        for (let daemon_number = 1; daemon_number <= daemon_count; daemon_number++) {

            forkDaemon(daemon_number);

        }

    }

    const main_daemon = async () => {

        const [daemon_number, daemon_count, stop_timeout] =
            ["daemon_number", "daemon_count", "stop_timeout"].map(key => {
                const value = parseInt(process.env[key]!);
                delete process[key];
                return value;
            });

        const {
            launch,
            beforeExitTask
        } = await daemonProcess(daemon_number, daemon_count);

        process.once("message", () => process.emit("beforeExit", process.exitCode = 0));

        process.once("disconnect", () => process.exit(1));

        //setProcessExitHandler.log = console.log.bind(console);

        setProcessExitHandler(
            async exitCause => {

                const error = exitCause.type === "EXCEPTION" ? exitCause.error : undefined;

                if (!!beforeExitTask) {

                    await beforeExitTask(error);

                }

            },
            (8 / 10) * stop_timeout,
            exitCause => exitCause.type !== "SIGNAL"
        );

        launch();

    };

    if (!process.send) {

        main_root(get_caller_file_path());

    } else {

        main_daemon();

    }

}

export namespace systemd {

    /**
     * Generate a systemd config file for a service created via "createService" function
     * enable by default, start by default.
     */
    export function createConfigFile(
        srv_name: string,
        main_js_path: string,
        node_path: string = process.argv[0],
        enable: "ENABLE" | false = "ENABLE",
        start: "START" | false = "START"
    ) {

        fs.writeFileSync(
            systemd_createConfigFile.mkPath(srv_name),
            Buffer.from([
                `[Unit]`,
                `After=network.target`,
                ``,
                `[Service]`,
                `ExecStart=${node_path} ${main_js_path}`,
                `StandardOutput=inherit`,
                `KillSignal=SIGUSR2`,
                `SendSIGKILL=no`,
                `Environment=NODE_ENV=production`,
                ``,
                `[Install]`,
                `WantedBy=multi-user.target`,
                ``
            ].join("\n"), "utf8")
        );

        execSyncNoCmdTrace("systemctl daemon-reload");

        if (!!enable) {

            execSyncNoCmdTrace(`systemctl enable ${srv_name}`, { "stdio": "pipe" });

        }

        if (!!start) {

            execSyncNoCmdTrace(`systemctl start ${srv_name}`);

        }

    }

    export namespace systemd_createConfigFile {

        export const mkPath = (srv_name: string) => `/etc/systemd/system/${srv_name}.service`;

    }

    /** Remove config file disable and reload daemon, never throw, stop is false by default */
    export function deleteConfigFile(srv_name: string, stop: false | "STOP" = false) {

        if (!!stop) {

            execSyncNoCmdTrace(`systemctl stop ${srv_name} || true`, { "stdio": "pipe" });

        }

        execSyncNoCmdTrace(`systemctl disable ${srv_name} || true`);

        try { fs.unlinkSync(systemd_createConfigFile.mkPath(srv_name)); } catch{ }

        execSyncNoCmdTrace("systemctl daemon-reload || true", { "stdio": "pipe" });

    }

}


