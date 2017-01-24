function MoveManager() {}

MoveManager.prototype = {
	start: function(scene, obj, startMousePosition) {
		this.scene = scene;
		this.object = obj;

		this.direction = -1;

		this.startMousePosition = startMousePosition;
		this.startObjectPosition = obj.position.clone();

		this.e = [];
		for (var i = 0; i < 3; i++) {
			this.e[i] = new THREE.Vector3(0,0,0)
			this.e[i].setComponent(i, 1)
		}
	},
	action: function(endMousePosition) {
		var mouseVector = endMousePosition.clone().sub(this.startMousePosition)
		if (this.direction != -1) {
			var moveVector = new THREE.Vector3(0,0,0)

			//수정 요망
			var a = mouseVector.dot(this.e[this.direction])

			moveVector.setComponent(this.direction, Math.round(a))

			this.object.moveTo(this.startObjectPosition.clone().add(moveVector))
		} else {
			if (mouseVector.length() > 0.1) {
				if (Math.abs(mouseVector.dot(this.e[0])) > Math.abs(mouseVector.dot(this.e[1]))) {
					this.direction = 0;
				} else {
					this.direction = 1;
				}

				if (Math.abs(mouseVector.dot(this.e[this.direction])) < Math.abs(mouseVector.dot(this.e[2]))) {
					this.direction = 2;
				}

				this.scene.arrowHelper[this.direction].visible = true
				this.scene.arrowHelper[this.direction].visible = true
			}
		}
	}
}