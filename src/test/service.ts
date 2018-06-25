import * as scriptLib from "../lib";
import * as child_process from "child_process";
import * as path from "path";
import * as fs from "fs";

/**
 * 
 * Example of of main for NodeJS app that should:
 * -Restart on crash.
 * -Execute as a specific user but need to performs
 * tasks as root before.
 * 
 * Main process should be run as root.
 * Process can be terminated gracefully via CTRL-C or
 * sending SIGUSR2 to ./pid
 * 
 * If the root process exit the child process start gracefully.
 * 
 */

const stop_timeout= 5000;

if( process.getuid() === 0 ){

    parentProcessMain();

}else if( !!process.send ){

    childProcessMain();

}else{

    throw new Error("Should be exec as root");

}

function parentProcessMain() {

    const pidfile_path = path.join(__dirname, "pid");

    scriptLib.stopProcessSync.log= console.log.bind(console);

    scriptLib.stopProcessSync(pidfile_path, "SIGUSR2");

    if( fs.existsSync(pidfile_path) ){
        throw Error("Other instance launched simultaneously");
    }

    fs.writeFileSync(pidfile_path, process.pid.toString());

    console.log("(parent) PID: " + process.pid);

    scriptLib.setExitHandler(async exitCause=>{

        console.log("(parent) in before exit", { exitCause });

        process.exitCode = await gracefullyTerminateChildProcess();

        console.log("(parent) deleting pid file");

        fs.unlinkSync(pidfile_path);

        console.log(`(parent) exiting with child process exit code: ${process.exitCode}`);

    }, stop_timeout);

    scriptLib.setExitHandler.log= console.log.bind(console);

    let gracefullyTerminateChildProcess: () => Promise<number>;

    (async function callee() {

        gracefullyTerminateChildProcess = () => Promise.resolve(0);

        console.log("(parent) Starting child process...we do stuffs as root before...");

        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log("(parent) We fork now");

        const childProcess = child_process.fork(
            __filename,
            [],
            {
                "uid": scriptLib.get_uid("pi"),
                "gid": scriptLib.get_gid("pi"),
                "silent": true,
                "cwd": "/home/pi",
                "execPath": "/usr/bin/node"
            }
        );

        childProcess.stdout.on("data", data => process.stdout.write(data));

        childProcess.once("close", () => callee());

        gracefullyTerminateChildProcess = () => new Promise<number>(resolve => {

            console.log("(parent) in gracefullyTerminateChildProcess");

            childProcess.send(null);

            childProcess.removeAllListeners("close");

            const timer = setTimeout(() => { 

                console.log("(parent) child process not responding, force kill...");

                childProcess.kill("SIGKILL") 

            }, (9/10)*stop_timeout );

            childProcess.once("close", (code: number | null ) => {

                if( typeof code !== "number" || isNaN(code) ){
                    code = 1;
                }

                console.log("(parent) child process close code: " + code);
                clearTimeout(timer);
                resolve(code);

            });

        });


    })();

}

async function childProcessMain() {

    //Here load launch from lib.
    const util = await import("util");

    const logfile_path = path.join(__dirname, "log");

    const log: typeof console.log = (...args)=> {

        const message = Buffer.from(
            util.format.apply(util, args) + "\n",
            "utf8"
        );

        process.stdout.write(message);

        fs.appendFileSync(logfile_path, message);


    };

    log("PID: " + process.pid);

    process.on("message", () => {

        log("received parent's message => terminate gracefully");

        process.emit("beforeExit", process.exitCode = 0);

    });

    process.once("disconnect", () => process.exit(1));

    scriptLib.setExitHandler(
        async () => {

            log("do some async stuffs before closing");
            await new Promise(resolve => setTimeout(resolve, 3000));
            log(`exiting with code ${process.exitCode}`);

        },
        (8/10) * stop_timeout,
        exitCause => exitCause.type !== "SIGNAL"
    );

    //scriptLib.setExitHandler.log= log;

    (async function launch() {

        while (true) {

            log(`performing actual job ${process.pid}...`);

            await new Promise(resolve => setTimeout(resolve, 1000));

            /*
            log(`Attempt to block the thread`);

            for (let i = 0; i < 99999; i++) {
                for (let j = 0; j < 99999; j++) {
                    for (let k = 0; k < 99999; k++) {
                        for (let l = 0; l < 99999; l++) {
                            (new Array(10000)).fill(NaN).map(() => Math.random());
                        }
                    }
                }
            }

            log(`process released`);
            */

        }

    })();

}
