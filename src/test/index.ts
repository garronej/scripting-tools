import * as scriptLib from "../lib";

console.log(scriptLib.colorize("OK", "GREEN"));


(async ()=>{

    const { exec, onSuccess }= scriptLib.start_long_running_process("We are going to do something that take time");

    await exec("cd /home/pi && sleep 3 && echo 'foo' > foo.txt", { "unix_user": "pi" });

    onSuccess();

    scriptLib.execSyncTrace("ls -l | grep foo.txt", { "cwd": "/home/pi" });

    scriptLib.execSyncTrace("cat foo.txt", { "cwd": "/home/pi" });

    scriptLib.execSync("rm /home/pi/foo.txt");

})();