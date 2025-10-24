import { findServer } from "./findPort";
import { app, port, waitToStart } from "@wxn0brp/zhiva-base-lib/server";
import { openWindow } from "@wxn0brp/zhiva-base-lib/openWindow";
import { downloadFile } from "./download";
const serverIP = await findServer(19851);

const baseUrl = "http://" + serverIP + ":19851/";
app.setOrigin([baseUrl])

app.get("/download", (req, res) => {
    const path = req.query.path;
    if (!path || !req.query.token) {
        res.status(400);
        return { err: true, msg: "Bad request" };
    }
    if (!path.startsWith(baseUrl)) return { err: true, msg: "Invalid path" };
    try {
        console.log("Downloading file:", req.query.path);
        downloadFile(req.query.path, req.query.token);
        return { err: false, msg: "File downloaded" };
    } catch (error) {
        res.status(500);
        console.error(error);
        return { err: true, msg: "Internal server error" };
    }
});

await waitToStart();
const window = openWindow(baseUrl + `app/zhiva.html?port=${port}`);
window.on("close", () => process.exit(0));