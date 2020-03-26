const database = firebase.database();
const roomDraw = database.ref("rooms/0/draw");
const roomPlayers = database.ref("rooms/0/players");
let playerKey = roomPlayers.push().key;

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var color = document.getElementById('color');
var width = document.getElementById('width');
var player = document.getElementById('player');
var currentStroke, currentLineWidth;

function getMousePosition(canvas, e){
    var rect = canvas.getBoundingClientRect();
    var ev = e.touches ? e.touches[0] : e;
    return {
        x: ev.clientX - rect.left,
        y: ev.clientY - rect.top
    }
}

ctx.beginPath();
ctx.strokeStyle = currentStroke = color.value;
ctx.lineWidth = currentLineWidth = width.value;

var penDown = false;
var bufferedPaint = [];
var intervalBuffered = setInterval(function(){
    if (bufferedPaint.length) {
        roomDraw.set(bufferedPaint.join(":") + "/" + playerKey);
        bufferedPaint = [];
    }
}, 500);

player.addEventListener('change', function() {
    roomPlayers.child(playerKey).set(this.value);
});

color.addEventListener('change', function(){
    ctx.beginPath();
    ctx.strokeStyle = currentStroke = this.value;
});
width.addEventListener('change', function(){
    ctx.beginPath();
    ctx.lineWidth = currentLineWidth = this.value;
});

const downEvent = function(e){
    e.preventDefault();

    changePen(currentStroke, currentLineWidth);
    
    var pos = getMousePosition(canvas, e);
    ctx.moveTo(pos.x, pos.y);

    penDown = true;
    bufferedPaint.push(`(${pos.x},${pos.y}):[${ctx.strokeStyle},${ctx.lineWidth}]`);
};

const moveEvent = function(e){
    e.preventDefault();
    if (penDown) {
        var pos = getMousePosition(canvas, e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        bufferedPaint.push(`${pos.x},${pos.y}`);
    }
};

const upEvent = function(e){
    penDown = false;
};

canvas.addEventListener('mousedown', downEvent);
canvas.addEventListener('touchstart', downEvent);
canvas.addEventListener('mousemove', moveEvent);
canvas.addEventListener('touchmove', moveEvent);
canvas.addEventListener('mouseup', upEvent);
canvas.addEventListener('touchend', upEvent);

const moveTo = function(x, y) {
    ctx.moveTo(x, y);
};

const lineTo = function(x, y) {
    ctx.lineTo(x, y);
    ctx.stroke();
};

const changePen = function(strokeStyle, lineWidth) {
    const differentStroke = ctx.strokeStyle !== strokeStyle;
    const differentLineWidth = ctx.lineWidth !== lineWidth;

    if (differentStroke || differentLineWidth) {
        ctx.beginPath();
    }

    if (differentStroke) {
        ctx.strokeStyle = strokeStyle;
    }

    if (differentLineWidth) {
        ctx.lineWidth = lineWidth;
    }
};

roomDraw.on("value", function(snapshot){
    const draw = snapshot.val().split("/");
    const coords = draw[0].split(":");
    const from = draw[1];
    if (from !== playerKey) {
        coords.forEach(coord => {
            if (coord.startsWith("(")) {
                moveTo(...coord.replace(/\(|\)/g, "").split(","));
            } else if (coord.startsWith("[")) {
                changePen(...coord.replace(/\[|\]/g, "").split(","));
            } else {
                lineTo(...coord.split(","));
            }
        });
    }
});
