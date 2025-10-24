import { spawnSync } from "bun";
import path from "path";

function defaultNameFromUrl(url: string): string {
    return decodeURIComponent(path.basename(new URL(url).pathname)) || "file";
}

function chooseSavePath(defaultName: string): string | null {
    if (process.platform === "linux") {
        const candidates = [
            ["zenity", "--file-selection", "--save", "--filename", defaultName],
            ["yad", "--file", "--save", "--filename", defaultName],
            ["kdialog", "--getsavefilename", defaultName],
        ];

        for (const cmd of candidates) {
            try {
                const exists = spawnSync(["which", cmd[0]]);
                if (exists.exitCode !== 0) continue;

                const res = spawnSync(cmd);
                return res.stdout.toString().trim();
            } catch { }
        }
        return null;
    } else if (process.platform === "darwin") {
        const res = spawnSync(["osascript", "-e",
            `POSIX path of (choose file name with prompt "Save file as:" default name "${defaultName}")`
        ]);
        if (res.exitCode === 0) return res.stdout.toString().trim();
    } else if (process.platform === "win32") {
        const script = `
Add-Type -AssemblyName System.Windows.Forms
$dlg = New-Object System.Windows.Forms.SaveFileDialog
$dlg.FileName = "${defaultName}"
if ($dlg.ShowDialog() -eq "OK") { Write-Output $dlg.FileName }
`;
        const res = spawnSync(["powershell", "-NoProfile", "-Command", script]);
        if (res.exitCode === 0) return res.stdout.toString().trim();
    }
    return null;
}

function downloadWithCurl(url: string, path: string, token: string) {
    console.log(["curl", "-L", "-o", path, "-H", `Cookie: token=${token}`, url])
    const res = spawnSync(["curl", "-L", "-o", path, "-H", `Cookie: token=${token}`, url]);
    if (res.exitCode === 0) {
        console.log(`File downloaded: ${path}`);
    } else {
        console.error("Download error:", res.stderr.toString());
    }
}

export function downloadFile(url: string, token: string) {
    const defaultName = defaultNameFromUrl(url);
    const path = chooseSavePath(defaultName);
    if (!path) return console.error("Path not selected");
    downloadWithCurl(url, path, token);
}
