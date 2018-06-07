import * as scriptLib from "../lib";
import * as path from "path";
import * as fs from "fs";

scriptLib.enableCmdTrace();

(async () => {

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

    scriptLib.fs_move("MOVE", dir_path, dir_path_copy, "file2.txt");

    console.assert(!fs.existsSync(path.join(dir_path, "file2.txt")));

    scriptLib.createSymlink(
        path.join(dir_path_copy, "file2.txt"),
        path.join(dir_path, "file2.txt")
    );

    console.assert(scriptLib.fs_areSame(dir_path, dir_path_copy));

    scriptLib.download_and_extract_tarball("https://github.com/jquery/jquery/archive/3.3.1.tar.gz", dir_path, "MERGE");
    scriptLib.download_and_extract_tarball("https://github.com/jquery/jquery/archive/3.3.1.tar.gz", dir_path_copy, "OVERWRITE IF EXIST");

    scriptLib.execSync(`rm -rf ${dir_path} ${dir_path_copy}`);

    const { exec, onSuccess } = scriptLib.start_long_running_process("Phony process");

    console.assert(await exec(`echo "foobar"`) === "foobar\n");

    await new Promise(resolve => setTimeout(resolve, 1000));

    onSuccess();

    console.assert(scriptLib.shellEval("which cat") === "/bin/cat");

    await scriptLib.apt_get_install_if_missing("git");

    console.log(scriptLib.colorize("ALL TESTS PASSED", "GREEN"));

})();

