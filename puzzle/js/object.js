function Object3D() {
  THREE.Object3D.call(this);
}

// 상속
Object3D.prototype = new THREE.Object3D();
Object3D.prototype.constructor = Object3D

// 지정한 모양과 색으로 초기화
Object3D.prototype.init = function(shape, color) {

  this.shape = shape;
  this.objColor = new THREE.Color(color);
  this.moveable = true;

  this.width = 0;
  this.height = 0;
  this.depth = 0;

  for (var i = 0; i<shape.length; i++) {
    for (var j = 0; j<shape[i].length; j++) {
      for (var k = 0;k<shape[i][j].length; k++) {
        if (shape[i][j][k] == 1) {
          var cube = new THREE.Mesh(
              new THREE.CubeGeometry(1, 1, 1), 
              new THREE.MeshPhongMaterial( { color: color, shininess:30})
          );

          cube.position.setY(i + 0.5)
          cube.position.setX(k + 0.5)
          cube.position.setZ(j + 0.5)

          if (this.depth < shape.length) {this.depth = shape.length}

          if (this.width < shape[i][j].length) {this.width = shape[i][j].length}
          if (this.height < shape[i].length) {this.height = shape[i].length}

          this.add(cube);
          cube.castShadow = true;
          //cube.receiveShadow = true;
        }
      }
    }
  }
  return this;
}

// 객체 이동, 수정 요망
Object3D.prototype.moveTo = function(ds) {
  if (!this.moveable) return -1;

  for(var i = 0; i<basicScene.objects.length; i++) {
    for(var j = 0; j < this.children.length; j++) {

      var vB = this.children[j].position.clone().add(ds)
      if (vB.y < 0) return -1; 

      if (i != basicScene.objects.indexOf(this)) {
        for(var k = 0; k < basicScene.objects[i].children.length; k++) {
          
          var vA = basicScene.objects[i].children[k].position.clone().add(basicScene.objects[i].position)
          if (vA.x == vB.x && vA.y == vB.y && vA.z == vB.z) return -1;
        }
      }
    }
  }
  this.position.set(ds.x, ds.y, ds.z);
}