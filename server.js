import { createServer } from "http";
import { Server } from "socket.io";
import { join, dirname } from "path";
import { readFile } from "fs/promises";
import chalk from "chalk";
import { fileURLToPath } from "url";

let __dirname = dirname(fileURLToPath(import.meta.url));

const httpServer = createServer(async (req, res) => {
    try {
        logger(req);
        if (await getStaticFiles(req, res)) return;
        switch (req.url) {
            default:
                res.statusCode = 404;
                res.setHeader("content-type", "text/plain");
                res.end("not found");
        }
    } catch (error) {
        console.log(error);
        res.statusCode = 500;
        res.end(error.message);
    }
});

const io = new Server(httpServer);

io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);
});

httpServer.listen(3000, () => {
    console.log("Server running on 3000");
});

function logger(req) {
    let url = chalk.green(req.url);
    let time = chalk.red(new Date().toLocaleTimeString());
    let method = chalk.blue(req.method);
    console.log(`${time}: ${method} - ${url}`);
}

async function getStaticFiles(req, res) {
    try {
        let fileName = req.url.substring(1);
        if (req.url == "/") fileName = "index.html";
        let path = join(__dirname, "static", fileName);
        let file = await readFile(path);
        res.statusCode = 200;
        res.end(file);
        return true;
    } catch (error) {
        console.log(error.message);
        return false;
    }
}
