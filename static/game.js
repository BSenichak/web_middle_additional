const socket = io();
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");

startBtn.addEventListener("click", () => {
    socket.emit("start");
});

let myId = null;
let players = {};
let ball = {};
let score = { left: 0, right: 0 };
let isPlaying = false;

socket.on("state", (state) => {
    players = state.players;
    ball = state.ball;
    score = state.score;
    isPlaying = state.isPlaying;

    draw();
});

socket.on("init", (data) => {
    myId = data.id;
    players = data.players;
});

socket.on("state", (state) => {
    players = state.players;
    ball = state.ball;
    draw();
});

// керування мишкою
canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;

    socket.emit("move", y);
});

function draw() {
    ctx.clearRect(0, 0, 600, 400);

    // гравці
    for (let id in players) {
        let p = players[id];

        ctx.fillRect(
            p.side === "left" ? 10 : 580,
            p.y,
            10,
            100
        );
    }

    // м'яч
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2);
    ctx.fill();

    // рахунок
    ctx.font = "30px Arial";
    ctx.fillText(score.left, 200, 50);
    ctx.fillText(score.right, 380, 50);

    // статус
    if (!isPlaying) {
        ctx.font = "20px Arial";
        ctx.fillText("Press START", 230, 200);
    }
}
