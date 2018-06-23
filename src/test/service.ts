import * as scriptLib from "../lib";
import * as child_process from "child_process";
import * as path from "path";
import * as os from "os";
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


const unix_user = "pi";

switch (os.userInfo().username) {
    case "root": parentProcessMain(); break;
    case unix_user: childProcessMain(); break;
    default: throw new Error("Need root access")
}

function parentProcessMain() {

    console.log("(parent) PID: " + process.pid);

    const pidfile_path = path.join(__dirname, "pid");

    fs.writeFileSync(pidfile_path, process.pid.toString());

    scriptLib.setExitHandler(async exitCause=>{

        console.log("(parent) in before exit", { exitCause });

        process.exitCode = await gracefullyTerminateChildProcess();

        console.log("(parent) deleting pid file");

        fs.unlinkSync(pidfile_path);

        console.log(`(parent) exiting with child process exit code: ${process.exitCode}`);

    });

    //scriptLib.setExitHandler.log= console.log.bind(console);

    let gracefullyTerminateChildProcess: () => Promise<number>;

    (async function callee() {

        gracefullyTerminateChildProcess = () => Promise.resolve(0);

        console.log("(parent) Starting child process...we do stuffs ar root before...");

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

            childProcess.send(null);

            childProcess.removeAllListeners("close");

            childProcess.once("close", code => resolve(code));

        });


    })();

}

async function childProcessMain() {

    console.log("PID: " + process.pid);

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


    process.on("message", () => {

        log("exit gracefully");

        process.emit("beforeExit", process.exitCode= 0);

    });


    scriptLib.setExitHandler(async ()=>{

        log("do some async stuffs before closing");
        await new Promise(resolve => setTimeout(resolve, 3000));
        log(`exiting with code ${process.exitCode}`);

    }, undefined, exitCause=> exitCause.type !== "SIGNAL" );

    //scriptLib.setExitHandler.log= log;

    (async () => {

        while (true) {

            log(`performing actual job ${process.pid}...`);

            await new Promise(resolve => setTimeout(resolve, 1000));

        }

    })();

}
