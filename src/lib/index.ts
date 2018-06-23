import * as child_process from "child_process";
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";

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


                });

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

        console.log(colorize("Error: This script require root privilege", "RED"));

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
export function setExitHandler(
    action: (exitCause: setExitHandler.ExitCause) => any,
    timeout = 4000,
    exitOnCause: (exitCause: Exclude<setExitHandler.ExitCause,setExitHandler.ExitCause.NothingElseToDo>)=> boolean= ()=> true
) {

    const log: typeof setExitHandler.log= (...args)=> setExitHandler.log.apply(setExitHandler, args);

    let handler: (exitCause: setExitHandler.ExitCause) => any = async exitCause => {

        if (exitCause.type !== "NOTHING ELSE TO DO" && !exitOnCause(exitCause)) {

            log("===prevent exit on cause===", exitCause);

            return;

        }

        log("===exit cause===", exitCause);

        handler = exitCause => {
            log("===ignored extra exit cause===", exitCause);
            setTimeout(() => { }, 1000000);
        };

        setTimeout(() => {
            log("===action handler timeout===");
            process.exit();
        }, timeout);

        let actionOut: any;

        try {

            actionOut = action(exitCause);

        } catch{

            log("===action handler throw===");
            process.exit();
            return;

        }

        if (actionOut instanceof Promise) {

            try {

                await actionOut;

            } catch{

                log("===action handler reject====");

                process.exit();
                return;
            }

        }

        log("=====action handler complete success===");

        process.exit();

    };

    for (const signal of setExitHandler.ExitCause.Signal.list) {

        process.on(signal, () => handler({ "type": "SIGNAL", signal }));

    }


    for (const eventName of ["uncaughtException", "unhandledRejection"]) {

        process.on(eventName as any, (error: Error) => handler({ "type": "EXCEPTION", error }));

    }

    process.on("beforeExit", () => handler({ "type": "NOTHING ELSE TO DO" }));

}

export namespace setExitHandler {

    export type ExitCause = ExitCause.Signal | ExitCause.Exception | ExitCause.NothingElseToDo;

    export namespace ExitCause {

        export type Signal = {
            type: "SIGNAL";
            signal: keyof typeof Signal._obj;
        };

        export namespace Signal {

            export const _obj = { "SIGINT": null, "SIGUSR2": null };

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




