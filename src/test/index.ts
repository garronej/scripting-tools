import * as scriptLib from "../lib";
import * as path from "path";
import * as fs from "fs";


process.removeAllListeners("unhandledRejection");
process.once("unhandledRejection", error => { throw error; });


(async () => {

    const [p_wget, p_node] = ["/tmp/v_wget", "/tmp/v_node"];

    scriptLib.execSync(`rm -f ${p_wget} ${p_node}`);

    const url= "github.com/jquery/jquery/archive/3.3.1.tar.gz";
    //const url = "https://github.com/garronej/asterisk/releases/download/latest/asterisk_armv7l.tar.gz";
    //const url = "https://ubuntu-fr.org/telechargement?action=dl";

    let before = Date.now();

    await scriptLib.web_get(url, p_node);

    console.log(`node: ${Date.now() - before} ms`);

    before = Date.now();

    await scriptLib.exec(`wget -nc ${url} -q -O ${p_wget}`);

    console.log(`wget: ${Date.now() - before} ms`);

    console.assert(scriptLib.fs_areSame(p_wget, p_node));

    scriptLib.execSync(`rm -f ${p_wget} ${p_node}`);

    console.assert(
        require("../../package.json")["name"]
        ===
        JSON.parse(await scriptLib.web_get("https://raw.githubusercontent.com/garronej/scripting-tools/master/package.json"))["name"]
    );

    console.assert(
        scriptLib.find_module_path("typescript", path.join(__dirname, "../.."))
        ===
        path.join(__dirname, "..", "..", "node_modules/typescript")
    );


    const dir_path = "/var/tmp/scripting-tools-tests";
    const dir_path_copy = path.join(dir_path, "..", `${path.basename(dir_path)}-copy`);

    scriptLib.execSync(`rm -rf ${dir_path} ${dir_path_copy} && mkdir -p ${path.join(dir_path, "dir")}`);

    scriptLib.execSync(`echo "[content of file 1]" > file1.txt`, { "cwd": dir_path });
    scriptLib.execSync(`echo "[content of file 2]" > file2.txt`, { "cwd": dir_path });
    scriptLib.execSync(`echo "[content of file 3]" > dir/file3.txt`, { "cwd": dir_path });

    scriptLib.fs_move("COPY", dir_path, dir_path_copy);

    console.assert(scriptLib.fs_areSame(dir_path, dir_path_copy));

    scriptLib.execSync(`echo "(modified)" >> file2.txt`, { "cwd": dir_path });

    for (let name of scriptLib.fs_ls(dir_path)) {

        console.assert(scriptLib.fs_areSame(dir_path, dir_path_copy, name) === (name !== "file2.txt"));

    }

    //scriptLib.fs_move("MOVE", dir_path, dir_path_copy, "file2.txt");
    scriptLib.fs_move("MOVE", dir_path, dir_path_copy, path.join(dir_path_copy, "file2.txt"));

    console.assert(!fs.existsSync(path.join(dir_path, "file2.txt")));

    scriptLib.createSymlink(
        path.join(dir_path_copy, "file2.txt"),
        path.join(dir_path, "file2.txt")
    );

    console.assert(scriptLib.fs_areSame(dir_path, dir_path_copy));

    await scriptLib.download_and_extract_tarball(url, dir_path, "MERGE");
    await scriptLib.download_and_extract_tarball(url, dir_path_copy, "OVERWRITE IF EXIST");

    scriptLib.enableCmdTrace();

    scriptLib.execSync(`rm -rf ${dir_path} ${dir_path_copy}`);

    const { exec, onSuccess } = scriptLib.start_long_running_process("Phony process");

    console.assert(await exec(`echo "foobar"`) === "foobar\n");

    await new Promise(resolve => setTimeout(resolve, 1000));

    onSuccess();

    console.assert(scriptLib.sh_eval("which cat") === "/bin/cat");

    console.assert(scriptLib.sh_if("cat tmp/file_that_does_not_exist.dummy") === false)
    console.assert(scriptLib.sh_if("which git") === true);

    await scriptLib.apt_get_install_if_missing("git");

    console.log(scriptLib.colorize("ALL TESTS PASSED", "GREEN"));

})();

/*
(async () => {

    while (true) {

        await new Promise(resolve => setTimeout(resolve, 2000));


        (function print_mem() {

            const used = process.memoryUsage();
            for (let key in used) {
                console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
            }

        })();

    }

})();
*/