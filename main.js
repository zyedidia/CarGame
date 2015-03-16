var world;
var keysDown = [];

// The main canvas to draw the world on
var canvas = $("#canvas")[0];
var ctx = canvas.getContext("2d");
var w = $("#canvas").width(); // Width
var h = $("#canvas").height(); // Height

// Game width and height
// The actual values will be sent by the server on connection
var gameWidth = w;
var gameHeight = h;

// Store the images
var images = [];
var sprites = {};
var markedToDestroy = [];

// The car that this client controls
var mainCar;

// Try to update at 80 fps
var updateTime = 1000 / 80;
var lastTime = 0;

// This client's id (sent to the client on connection)
var myID;

// The socket used for communication with the server
var socket = io();

// Messages

socket.on('id', function(id) {
	// Message from the server containing this client's id
	console.log("Received id " + id);
	myID = id;
});

// Message containing the real game dimensions
socket.on('gamedimensions', function(dimensions) {
	// Set the real values of gameWidth and gameHeight
	gameWidth = dimensions.width;
	gameHeight = dimensions.height;
});

socket.on('newcar', function(data) {
	console.log("New car with id " + data.id);
	addCar(data.pos.x, data.pos.y, data.angle, data.id);
});

socket.on('newobstacle', function(data) {
	addObstacle(data.pos.x, data.pos.y, data.angle, data.width, data.height, data.immovable, data.id);
});

socket.on('destroysprite', function(id) {
	markedToDestroy.push(sprites[id]);
});

socket.on('spritechanged', function(data) {
	if (typeof sprites[data.id] !== 'undefined') {
		sprites[data.id].body.SetPositionAndAngle(data.pos, data.angle);
	}
});

// When a key is pressed, add it to keysDown and send the new array to the server
addEventListener("keydown", function (e) {
	var key = e.keyCode || e.which;
	keysDown[key] = true;
	socket.emit('input', keysDown);
}, false);

// When a key is released, remove it from keysDown and send the new array to the server
addEventListener("keyup", function (e) {
	var key = e.keyCode || e.which;
	delete keysDown[key];
	socket.emit('input', keysDown);
}, false);

init();
start();

// Set up the physics world
function setupWorld() {
	world = new b2World(new b2Vec2(0, 0), true);

	// Box2D debug drawing
	var debugDraw = new b2DebugDraw();
	debugDraw.SetSprite(ctx);
	debugDraw.SetDrawScale(scale);
	debugDraw.SetFillAlpha(0.3);
	debugDraw.SetLineThickness(1.0);
	debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);

	world.SetDebugDraw(debugDraw);
}

function init() {
	// Load images
	loadImage("img/car.png");
	loadImage("img/obstacle.png");

	setupWorld();
}

function start() {
	// Start the main loop
	window.requestAnimationFrame(run);
}

function run(time) {
	var now = Date.now();
	var delta = now - lastTime;

	// Make sure we are not updating faster than 80 fps
	if (delta > updateTime) {
		update();
		render();
		lastTime = now - (delta % updateTime);
	}

	window.requestAnimationFrame(run);
}

function update() {
	// Update the physics world
	world.Step(1 / 80, 10, 10);

	// Update all sprites
	for (var id in sprites) {
		var s = sprites[id];
		if (s instanceof Car) {
			s.handleKeys(keysDown);
			s.updatePosition();
		}
		s.update();
	}

	// Remove sprites in markedToDestroy
	collectGarbage();
}

function collectGarbage() {
	for (i in markedToDestroy) {
		var s = markedToDestroy[i];
		world.DestroyBody(s.body);
		console.log("Destroyed 1 body");
		delete sprites[s.id];
		console.log("Destroyed 1 sprite");
	}

	markedToDestroy = [];
}

function render() {
	// Draw the white background
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, w, h);

	ctx.save();
	// Translate everything to look like the camera is moving in the world
	// When actually the world is moving around the camera
	ctx.translate(-camera.x * scale + w / 2, -camera.y * scale + h / 2);

	// Draw the box2D debug data
	world.DrawDebugData();
	world.ClearForces();

	// Draw the black outline on the edge of the world
	ctx.strokeStyle = "black";
	ctx.strokeRect(0, 0, gameWidth * scale, gameHeight * scale);

	for (var id in sprites) {
		var s = sprites[id];
		s.draw();
	}

	// Restore the translations we made at the start of the function
	ctx.restore();
}

function addObstacle(x, y, angle, width, height, immovable, id) {
	var image = new CanvasImage(images[1]);
	var obstacle = new Obstacle(image, world, x, y, angle, width, height, id);
	if (immovable) obstacle.setImmovable();
	sprites[id] = obstacle;
}

function addCar(x, y, angle, id) {
	var image = new CanvasImage(images[0]);
	var car = new Car(image, world, x, y, angle, id, id === myID);
	if (id === myID) mainCar = car;
	console.log("Adding car with id " + id);
	sprites[id] = car;
}

function loadImage(imgSrc) {
	var image = new Image();
	image.src = imgSrc;
	images.push(image);
}
