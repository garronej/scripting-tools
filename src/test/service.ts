import * as scriptLib from "../lib";

scriptLib.createService({
    "stop_timeout": 5678,
    "rootProcess": async () => {

        const path = await import("path");
        const child_process = await import("child_process");
        const util = await import("util");

        const log: typeof console.log = (...args) => {
            process.stdout.write(
                Buffer.from(
                    scriptLib.colorize(`(root process custom) ${util.format.apply(util, args)}\n`, "YELLOW"),
                    "utf8"
                )
            );
        }

        return {
            "pidfile_path": path.join(__dirname, "pid"),
            "isQuiet": false,
            "doForwardDaemonStdout": true,
            "daemon_unix_user": "pi",
            "daemon_node_path": "/usr/bin/node",
            "daemon_cwd": "/home/pi",
            "daemon_restart_after_crash_delay": 1234,
            //"daemon_restart_after_crash_delay": -1,
            "preForkTask": async ref => {


                while (true) {

                    const isSuccess = await new Promise<boolean>(resolve => {

                        log("preFork subprocess...");

                        const childProcess = child_process.exec("sleep 0.2 && (($RANDOM%2))", { "shell": "/bin/bash" });

                        childProcess.once("error", () => resolve(false))
                            .once("close", code => (code === 0) ? resolve(true) : resolve(false))
                            ;

                        ref.terminateSubProcesses = () => new Promise(resolve_ => {

                            resolve = () => {

                                log("preFork subprocess killed");

                                resolve_(0);

                            };

                            log("kill preFork");

                            childProcess.kill("SIGKILL");

                        });

                    });

                    if (isSuccess) {

                        log("preFork tasks complete");

                        break;

                    } else {

                        log("not yet");

                    }

                }

            }
            
        };

    },
    "daemonProcess": async () => {

        const os = await import("os");
        const util = await import("util");

        const log: typeof console.log = (...args) => {
            process.stdout.write(
                Buffer.from(
                    scriptLib.colorize(`(daemon process) ${util.format.apply(util, args)}\n`, "GREEN"),
                    "utf8"
                )
            );
        }

        return {
            "launch": async () => {

                while (true) {

                    log("Grinding hard...", {
                        "pid": process.pid,
                        "user": os.userInfo().username,
                        "cwd": process.cwd()
                    });

                    await new Promise(resolve => setTimeout(resolve, 500));

                }

            },
            "beforeExitTask": async error => {

                if (!!error) {

                    log("Exiting because of an error:", error);

                } else {

                    log("Not exiting because of exception");

                }

                log("Performing phony cleanup task...");

                await new Promise(resolve => setTimeout(resolve, 800));

                log("before exit completed successfully!");

            }
        };

    }
});
