var world;

// Use keysDown[id] to get a list of keys down for that id
var keysDown = {};

// Use sprites[id] to get the sprite
sprites = {};
// All sprites in this list will be destroyed after the frame is over
markedToDestroy = [];

var curID = 0;

// Try to update at 80 frames per second (gets about 75 in practice)
var updateTime = 1000 / 80;
var lastTime = 0;

// Width and height of the world
var gameWidth = 50;
var gameHeight = 50;

// Set up the physics world
function setupWorld() {
	//                               v No gravity
	world = new b2World(new b2Vec2(0, 0), true);

	// Add obstacles here
	var numObstacles = randInt(3, 9);
	for (i = 0; i < numObstacles; i++) {
		addObstacle(randInt(5, gameWidth - 5), randInt(5, gameHeight - 5), randInt(0, 359) * toRadians, randInt(1, 4), randInt(1, 4));
	}

	// The four outer walls
	addObstacle(gameWidth / 2, 0, 0, gameWidth / 2, 0.01, true);
	addObstacle(gameWidth / 2, gameHeight, 0, gameWidth / 2, 0.01, true);
	addObstacle(0, gameHeight / 2, 0, 0.01, gameHeight / 2, true);
	addObstacle(gameWidth, gameHeight / 2, 0, 0.01, gameHeight / 2, true);
}

function tick() {
	var now = Date.now();
	var delta = now - lastTime;
	// Make sure it is not updating faster than 80 fps
	if (delta > updateTime) {
		update();
		lastTime = now - (delta % updateTime);
	}
}

function update() {
	// Update the physics
	world.Step(1 / 80, 10, 10);

	for (var id in sprites) {
		var sprite = sprites[id];
		if (sprite instanceof Car) {
			// Handle the keys that have been sent by the client with the current id
			sprite.handleKeys(keysDown[id]);
			sprite.updatePosition();
		}
		sprite.update();
	}

	// Destroy all sprites in markedToDestroy
	collectGarbage();
}

function collectGarbage() {
	for (i in markedToDestroy) {
		var s = markedToDestroy[i];
		world.DestroyBody(s.body);
		console.log("Destroyed 1 body");
		delete sprites[s.id];
		console.log("Destroyed 1 sprite");
		// Tell all clients to destroy this sprite too
		io.sockets.emit('destroysprite', s.id);
	}

	markedToDestroy = [];
}

// Add an obstacle to the world
function addObstacle(x, y, angle, width, height, immovable) {
	curID++;
	var obstacle = new Obstacle("", world, x, y, angle, width, height, curID);
	if (immovable) obstacle.setImmovable();
	io.sockets.emit('newobstacle', {pos: new b2Vec2(x, y), angle: angle, width: width, height: height, immovable: immovable, id: curID});
	sprites[curID] = obstacle;
}

// Add a car to the world
function addCar(x, y, angle, id) {
	var car = new Car("", world, x, y, angle, id, true);
	io.sockets.emit('newcar', {pos: new b2Vec2(x, y), angle: angle, id: id});
	console.log("Creating new car with id " + id);
	sprites[id] = car;
}

// When a new user connects
function newConnection(socket) {
	// Send them all the current sprites
	for (i in sprites) {
		var s = sprites[i];
		if (s instanceof Car) {
			socket.emit('newcar', {pos: s.body.GetPosition(), angle: s.body.GetAngle(), id: s.id});
		} else if (s instanceof Obstacle) {
			socket.emit('newobstacle', {pos: s.body.GetPosition(), angle: s.body.GetAngle(), width: s.width, height: s.height, immovable: s.immovable, id: s.id});
		} else {
			console.log("Unknown sprite: " + (typeof sprites[i]));
		}
	}

	// Send them the game dimensions
	socket.emit('gamedimensions', {width: gameWidth, height: gameHeight});

	// Tell all clients to make a new tank (including the new user)
	addCar(9, 15, 0, socket.id);
}

function randInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Export variables needed in server.js
module.exports.keysDown = keysDown;

module.exports.sprites = sprites;

module.exports.setupWorld = setupWorld;
module.exports.tick = tick;
module.exports.newConnection = newConnection;
module.exports.addCar = addCar;
module.exports.addObstacle = addObstacle;
