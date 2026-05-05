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

let players = {};
let ball = { x: 300, y: 200, vx: 4, vy: 3 };
const sides = ["left", "right"];
let score = { left: 0, right: 0 };
let isPlaying = false;

io.on("connection", (socket) => {
    console.log(
        chalk.yellow("\nSocket:"),
        chalk.blue("Player connected id:"),
        chalk.green(socket.id),
    );

 if (Object.keys(players).length < 2) {
        const takenSides = Object.values(players).map(p => p.side);
        const freeSide = sides.find(s => !takenSides.includes(s));

        players[socket.id] = {
            y: 150,
            side: freeSide
        };
    }

    socket.emit("init", {
        id: socket.id,
        players
    });

    socket.on("move", (y) => {
        if (players[socket.id]) {
            players[socket.id].y = y;
        }
    });

    socket.on("start", () => {
    if (Object.keys(players).length === 2) {
        isPlaying = true;

        // ресет м’яча
        ball.x = 300;
        ball.y = 200;
        ball.vx = 4;
        ball.vy = 3;
    }
});

    socket.on("disconnect", () => {
        delete players[socket.id];
    });
});

setInterval(() => {
    if (!isPlaying) {
        io.emit("state", { players, ball, score, isPlaying });
        return;
    }

    ball.x += ball.vx;
    ball.y += ball.vy;

    // стіни
    if (ball.y < 0 || ball.y > 400) {
        ball.vy *= -1;
    }

    // зіткнення
    for (let id in players) {
        let p = players[id];

        if (p.side === "left" && ball.x < 20) {
            if (ball.y > p.y && ball.y < p.y + 100) {
                ball.vx *= -1;
            }
        }

        if (p.side === "right" && ball.x > 580) {
            if (ball.y > p.y && ball.y < p.y + 100) {
                ball.vx *= -1;
            }
        }
    }

    // ГОЛ
    if (ball.x < 0) {
        score.right++;
        resetBall();
    }

    if (ball.x > 600) {
        score.left++;
        resetBall();
    }

    io.emit("state", { players, ball, score, isPlaying });

}, 1000 / 60);

function resetBall() {
    isPlaying = false;

    ball.x = 300;
    ball.y = 200;

    ball.vx = (Math.random() > 0.5 ? 4 : -4);
    ball.vy = 3;
}

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
