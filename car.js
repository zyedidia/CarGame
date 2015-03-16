Car = function(img, world, startx, starty, angle, id, mainCar) {
	this.mainCar = mainCar;
	this.init(img, id);
	this.accel = 1;
	this.maxSpeed = 5; this.rotateSpeed = 2;
	this.width = 0.75; this.height = 1.25;

	this.createBody(world, startx, starty);
	this.createShape();

	this.body.SetSleepingAllowed(false);
	this.body.SetLinearDamping(10);
	this.body.SetAngle(angle);
}

Car.prototype = new Sprite();
Car.prototype.constructor = Car;

Car.prototype.update = function() {
	Sprite.prototype.update.call(this);

	if (typeof camera !== 'undefined') {
		if (this.mainCar) {
			var pos = this.body.GetPosition();
			camera.x = pos.x; camera.y = pos.y;
		}
	}

	// console.log("Position: " + JSON.stringify(this.body.GetPosition()));
}

Car.prototype.handleKeys = function(keysDown) {
	// If this car is not controlled by the current client do not use keypresses for it
	if (!this.mainCar) return;
	if (typeof keysDown === 'undefined') {
		keysDown = [];
	} 
	// Up arrow
	var forward = keysDown[38];
	// Down arrow
	var backward = keysDown[40];
	// Right arrow
	var right = keysDown[39];
	// Left arrow
	var left = keysDown[37];
	// Spacebar
	var shoot = keysDown[32];

	if (forward) {
		this.speed += this.accel;
	} if (backward) {
		this.speed -= this.accel;
	}

	if (this.speed > this.maxSpeed) {
		this.speed = this.maxSpeed;
	} else if (this.speed < -this.maxSpeed) {
		this.speed = -this.maxSpeed;
	}

	if (!(forward || backward)) {
		this.speed = 0;
	}

	if (right) {
		this.torque = this.rotateSpeed;
	} if (left) {
		this.torque = -this.rotateSpeed;
	}

	if (!(right || left)) {
		this.torque = 0;
	}
}

Car.prototype.updatePosition = function() {
	var vx = this.speed * Math.cos(this.body.GetAngle() - Math.PI / 2);
	var vy = this.speed * Math.sin(this.body.GetAngle() - Math.PI / 2);

	var velocity = new b2Vec2(vx, vy);
	this.body.ApplyImpulse(velocity, this.body.GetPosition());

	this.body.SetAngularVelocity(this.torque);
}

if (typeof module !== 'undefined') module.exports = Car;
