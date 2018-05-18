import * as child_process from "child_process";
import * as readline from "readline";
import * as fs from "fs";

let trace= false;

export function enableTrace(): void {
    trace= true;
}

function traceExec(cmd: string, options: any){

    console.log(
        colorize(`$ ${cmd} `, "YELLOW") + (!!options?`${JSON.stringify(options)}\n`:"")
    );

}

function fetch_id(options: any) {

    if( !options ){ 
        return;
    }

    if (!!options.unix_user) {

        const unix_user = options.unix_user;

        delete options.unix_user;

        const get_id = (type: "u" | "g") =>
            parseInt(
                child_process.execSync(`id -${type} ${unix_user}`)
                    .toString("utf8")
                    .slice(0, -1)
            );

        options.uid = get_id("u");
        options.gid = get_id("g");

    }

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

export function execSync(
    cmd: string,
    options?: child_process.ExecSyncOptions & { unix_user?: string },
): string {

    if( trace ){

        traceExec(cmd, options);

    }

    fetch_id(options);

    return child_process.execSync(cmd, { ...(options as any || {}), "encoding": "utf8" });

}

export function execSyncTrace(
    cmd: string, 
    options?: child_process.ExecSyncOptions & { unix_user?: string },
): void {

    traceExec(cmd, options);

    fetch_id(options);

    child_process.execSync(cmd, { ...(options as any || {}), "stdio": "inherit" });

}


export function exec(
    cmd: string,
    options?: child_process.ExecOptions & { unix_user?: string }
): Promise<string> {

    if( trace ){

        traceExec(cmd, options);

    }

    return new Promise(
        async (resolve, reject) => {

            fetch_id(options);

            child_process.exec(
                cmd,
                { ...(options as any || {}), "encoding": "utf8" },
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


export function start_long_running_process(message: string): {
    onError(errorMessage: string): void;
    onSuccess(message?: string): void;
    exec: typeof exec;
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

    const onComplete = (message: string) => {

        clearInterval(timer);

        moveBack();

        process.stdout.write(`${message}\n`);

    };

    const onError= errorMessage => onComplete(colorize(errorMessage, "RED"));
    const onSuccess= message => onComplete(colorize(message || "ok", "GREEN"));

    return {
        onError,
        onSuccess,
        "exec": async function(...args){

            try{

                return await exec.apply(null, args);

            }catch(error){

                onError(error.message);

                throw error;

            }

        }
    };

};


export async function apt_get_install(
    package_name: string,
    prog?: string
) {

    process.stdout.write(`Looking for ${package_name} ... `);

    if (!!prog && apt_get_install.doesHaveProg(prog)) {

        console.log(`${prog} executable found. ${colorize("OK", "GREEN")}`);

        return;

    }

    if (apt_get_install.isPkgInstalled(package_name)) {

        console.log(`${package_name} is installed. ${colorize("OK", "GREEN")}`);

        return;

    }

    readline.clearLine(process.stdout, 0);
    process.stdout.write("\r");

    const { onSuccess, exec } = start_long_running_process(`Installing ${package_name} package`);

    try {

        if (apt_get_install.isFirst) {

            await exec("apt-get update");

            apt_get_install.isFirst = false;

        }

        await exec(`apt-get -y install ${package_name}`);

    } catch (error) {

        apt_get_install.onError(error);

    }

    apt_get_install.onInstallSuccess(package_name);

    onSuccess("DONE");

}

export namespace apt_get_install {

    export function record_installed_package(
        file_json_path: string,
        package_name: string
    ): void {

        execSync(`touch ${file_json_path}`);

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

    export let isFirst = true;

    export function isPkgInstalled(package_name: string): boolean {

        try {

            console.assert(
                !!child_process.execSync(`dpkg-query -W -f='\${Status}' ${package_name} 2>/dev/null`)
                    .toString("utf8")
                    .match(/^install ok installed$/)
            );

        } catch{

            return false;

        }

        return true;

    }

    export function doesHaveProg(prog: string): boolean {

        try {

            child_process.execSync(`which ${prog}`);

        } catch{

            return false;

        }

        return true;

    }

}

export function exit_if_not_root(): void {
    if (process.getuid() !== 0) {

        console.log("Error: This script require root privilege");

        process.exit(1);

    }
}
