var basicScene;
function BasicScene(){}

BasicScene.prototype = {
	// 생성자, 문법이 바뀐 이유는 IE를 지원하기 위해서
	init: function() {

		// scene 생성
		this.scene = new THREE.Scene();

		// 현재 지목한 객체
		this.intersect;

		// 기본 세팅들
		this.VIEW_WIDTH = $('#basic-scene').outerWidth();
		this.VIEW_HEIGHT = $('#basic-scene').outerHeight();

		//카메라를 위해서
		var VIEW_ANGLE = 45;
		var ASPECT = this.VIEW_WIDTH / this.VIEW_HEIGHT;

		var NEAR = 0.1;
		var FAR = 100;

		// 카메라 좌표임 극좌표계로 하려고
		this.theta = Math.PI/8 * 2, this.phi = Math.PI/8 * 3, this.r = 20;

		// 마우스 좌표긴 한데 중심을 (0,0)으로 하고 -1 ~ 1 까지임
		this.mouse = new THREE.Vector2();

		// 카메라 생성 및 세팅
		this.camera = new THREE.PerspectiveCamera(this.VIEW_ANGLE, this.ASPECT, this.NEAR, this.FAR);
		this.scene.add(this.camera);
		this.moveCamera();

		// 레이캐스터
		this.raycaster = new THREE.Raycaster();
		
		// 마우스 클릭 여부
		this.isMousedown = false;

		// scene 내의 오브젝트 배열
		this.objects = [];

		// 이건 뭐 웹개발팀이 자리를 마련해주겠지
		this.container = $('#basic-scene');

		// 환경 세팅
		this.setCircumstances();
		// 렌더러 쳐넣기
		this.setRenderer();
		this.setAspect();

		// 이벤트 핸들러 시작
		this.setControls();

		this.mm = new MoveManager();
		this.plane = new THREE.Mesh(
			new THREE.PlaneBufferGeometry(500, 500, 8, 8), 
			new THREE.MeshBasicMaterial({color: 0xffffff})
		);

		this.plane.material.visible = false;
		this.scene.add(this.plane);

		this.guide = []

		for (var i = 0; i < 3; i++) {
			var material = new THREE.LineDashedMaterial( {
				color: 0xffffff,
				scale: 1,
				dashSize: 3,
				gapSize: 100,
			});

			var geometry = new THREE.Geometry();
			geometry.vertices.push(
				new THREE.Vector3( -10, 0, 0 ),
				new THREE.Vector3( 0, 10, 0 )
			);

			this.guide[i] = new THREE.Line( geometry, material );
			//this.scene.add(this.guide[i]);
		}
		return this;
	},

	// 이벤트 핸들러는 다 여기 박아넣는거야
	setControls: function() {

		// 이벤트 내에서 this 못쓰니까
		var scene = this

		// 사이즈 조정되면
		this.container.resize(function() {
			basicScene.setAspect();
		});

		// 마우스 움직이면
		this.container.mousemove(function(event) {
			if(event.target.nodeName == "CANVAS") {
				if (!scene.isMousedown) {
					// 그냥 움직일때는 잡히는게 있나 체크만
					scene.mouse.x = (event.clientX / scene.VIEW_WIDTH) * 2 - 1;
					scene.mouse.y = -(event.clientY / scene.VIEW_HEIGHT) * 2 + 1;
					scene.checkIntersect();
				} else {
					if (scene.intersect) {
						// 장애물이 있으면 그걸 움직여야지

						scene.mouse.x = (event.clientX / scene.VIEW_WIDTH) * 2 - 1;
						scene.mouse.y = -(event.clientY / scene.VIEW_HEIGHT) * 2 + 1;
						scene.raycaster.setFromCamera(scene.mouse, scene.camera);

						scene.mm.action(scene.raycaster.intersectObject(scene.plane)[0].point);

						//scene.intersect.object.parent.position.copy(scene.raycaster.intersectObject(scene.plane)[0].point)

					} else {
						// 장애물이 없을때는 화면 돌리기
						scene.phi += Math.PI * ((event.clientX / scene.VIEW_WIDTH) * 2 - 1 - scene.mouse.x);
						scene.theta += 1/2 * Math.PI * ((-(event.clientY / scene.VIEW_HEIGHT) * 2 + 1) - scene.mouse.y);

						if(Math.PI/16 > scene.theta || scene.theta > Math.PI/32 * 15) {
							scene.theta -= 1/2 * Math.PI * (-(event.clientY / scene.VIEW_HEIGHT) * 2 + 1 - scene.mouse.y);
						}

						scene.mouse.x = (event.clientX / scene.VIEW_WIDTH) * 2 - 1;
						scene.mouse.y = -(event.clientY / scene.VIEW_HEIGHT) * 2 + 1;
					}
				}
			}
		});

		// 마우스 누르면
		this.container.mousedown(function(event) {
			if(event.target.nodeName == "CANVAS") {
				scene.mouse.x = (event.clientX / scene.VIEW_WIDTH) * 2 - 1;
				scene.mouse.y = -(event.clientY / scene.VIEW_HEIGHT) * 2 + 1;
				scene.getIntersect();
				scene.isMousedown = true;
			}
		});

		// 마우스 떼면
		this.container.mouseup(function(event) {
			if(event.target.nodeName == "CANVAS") {
				scene.intersect = undefined
				scene.isMousedown = false;
				scene.checkIntersect();
			}
		});
	},

	// 사이즈 조정되면 할짓, 적절히 수정 요망
	setAspect: function() {
		// 사이즈 조정되면 canvas 맞추고
		var w = this.container.width(),
				h = this.container.height();

		// 다 맞추기
		this.renderer.setSize(w, h);
		this.camera.aspect = w / h;
		this.camera.updateProjectionMatrix();
	},

	// 환경 세팅
	setCircumstances: function() {
		this.scene.fog = new THREE.Fog( 0xffffff, 1, 110 );
		this.scene.fog.color.setHSL( 0.6, 0, 1 );

		// LIGHTS
		this.hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
		this.hemiLight.color.setHSL( 0.6, 1, 0.6 );
		this.hemiLight.groundColor.setHSL( 0.6, 0.1, 0.75 );
		this.hemiLight.position.set( 0, 500, 0 );
		this.scene.add(this.hemiLight);
		//
		this.dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
		this.dirLight.color.setHSL( 0.1, 1, 0.95 );
		this.dirLight.position.set( -1, 1.75, 1.25 );
		this.dirLight.position.multiplyScalar( 5 );

		this.dirLight.castShadow = false

		// this.dirLight.shadow.mapSize.width = 1024 * 3;
		// this.dirLight.shadow.mapSize.height = 1024 * 3;
		
		// this.dirLight.shadow.camera.left = -30;
		// this.dirLight.shadow.camera.right = 30;
		// this.dirLight.shadow.camera.top = 30;
		// this.dirLight.shadow.camera.bottom = -30;

		console.log(this.dirLight.shadow.camera)
		this.scene.add(this.dirLight);

		// SKYDOME
		var vertexShader = [
		"varying vec3 vWorldPosition;",
		"void main() {",
		"vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",
		"vWorldPosition = worldPosition.xyz;",
		"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
		"}"
		].join("\n");

		var fragmentShader = [
		"uniform vec3 topColor;",
		"uniform vec3 bottomColor;",
		"uniform float offset;",
		"uniform float exponent;",
		"varying vec3 vWorldPosition;",
		"void main() {",
		"float h = normalize( vWorldPosition + offset ).y;",
		"gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );",
		"}"
		].join("\n");

		var uniforms = {
			topColor:    { value: new THREE.Color( 0x0077ff) },
			bottomColor: { value: (new THREE.Color( 0xbcdbff)) },
			offset:      { value: 0 },
			exponent:    { value: 0.8 }
		};

		uniforms.topColor.value.copy(this.hemiLight.color);
		this.scene.fog.color.copy(uniforms.bottomColor.value);

		var skyGeo = new THREE.SphereGeometry( 100, 15, 15);
		var skyMat = new THREE.ShaderMaterial( { vertexShader: vertexShader, fragmentShader: fragmentShader, uniforms: uniforms, side: THREE.BackSide } );
		var sky = new THREE.Mesh(skyGeo, skyMat );

		// Generate random noise texture
		var noiseSize = 32;
		var size = noiseSize * noiseSize;
		var data = new Uint8Array( 4 * size );
		for ( var i = 0; i < size * 4; i +=4 ) {
			var noise = 1 - Math.random()*0.1
		  data[ i ] = 85 * noise;
		  data[ i+1 ] = 121 * noise;
		  data[ i+2 ] = 33 * noise;
		  data[ i+3 ] = 1;
		}
		var dt = new THREE.DataTexture( data, noiseSize, noiseSize, THREE.RGBAFormat );
		dt.wrapS = THREE.RepeatWrapping;
		dt.wrapT = THREE.RepeatWrapping;
		dt.repeat.set(200,200)
		dt.needsUpdate = true;

		this.scene.add( sky );
		var groundGeo = new THREE.PlaneGeometry( 200, 200 );
		var groundMat = new THREE.MeshPhongMaterial( { color: 0x050505, map:dt, shininess:0} );
		groundMat.color.setHSL( 0.095, 1, 0.75 );

		var ground = new THREE.Mesh( groundGeo, groundMat );
		ground.rotation.x = -Math.PI/2;

		ground.position.y = 0;
		ground.receiveShadow = true
		this.scene.add( ground );
	},

	// 렌더러 세팅
	setRenderer: function() {
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setClearColor(this.scene.fog.color );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );

		this.renderer.gammaInput = true;
		this.renderer.gammaOutput = true;
		this.renderer.shadowMap.enabled = true;

		this.container.prepend(this.renderer.domElement);
	},

	// camera 세팅, 매번 해주셈
	moveCamera: function() {

		this.camera.position.setX(Math.sin(this.theta) * Math.cos(this.phi) * this.r);
		this.camera.position.setZ(Math.sin(this.theta) * Math.sin(this.phi) * this.r);
		this.camera.position.setY(Math.cos(this.theta) * this.r);

		this.camera.up = new THREE.Vector3(0,1,0);
		this.camera.lookAt(this.scene.position);
	},

	// 장애물 체크 (hover)
	checkIntersect: function() {
		this.raycaster.setFromCamera(this.mouse, this.camera);	
		var intersect = this.raycaster.intersectObjects(this.objects, true)[0];

		for(var i = 0; i<this.objects.length; i++) {
			for(var j = 0; j < this.objects[i].children.length; j++) {
				this.objects[i].children[j].material.color.set(this.objects[i].objColor)
			}
		}

		if(intersect) {
			var parent = intersect.object.parent;
			for(var i = 0; i<parent.children.length; i++) {
				parent.children[i].material.color.addScalar(0.1)
			}
		}
	},

	// 장애물 선택 (click)
	getIntersect: function() {
		this.raycaster.setFromCamera(this.mouse, this.camera);	

		var intersect = this.raycaster.intersectObjects(this.objects, true)[0];

		if (intersect) {
			if (this.intersect == intersect) {
				this.intersect = undefined;
			} else {
				this.intersect = intersect
				this.plane.position.copy(intersect.point);
				this.plane.lookAt(this.camera.position);

				this.mm.start(this, intersect.object.parent, intersect.point)
			}
		} else {
			this.intersect = undefined
		}
	},

	// Scene 업뎃후 그리기
	frame: function() {
		this.moveCamera();
		this.renderer.render(this.scene, this.camera);
	},

	//그림자 토글
	toggleShadow: function() {
		if (this.dirLight.castShadow) {
			this.dirLight.castShadow = false;
		} else {
			this.dirLight.castShadow = true;
		}
	},

	setShadow: function(shadow) {
		this.dirLight.castShadow = shadow;
	}
};
