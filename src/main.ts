import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
// import Stats from "three/examples/jsm/libs/stats.module.js";
import * as CANNON from "cannon-es";
import { Mesh } from "three";

const scene = new THREE.Scene();

const light1 = new THREE.SpotLight(0xffffff, 1500, 250);
light1.position.set(0, 50, 0);
light1.angle = Math.PI / 8;
light1.penumbra = 0.5;
light1.castShadow = true;
light1.shadow.mapSize.width = 1024;
light1.shadow.mapSize.height = 1024;
light1.shadow.camera.near = 0.5;
light1.shadow.camera.far = 250;
scene.add(light1);

const environmentTexture = new THREE.CubeTextureLoader()
  .setPath("https://sbcode.net/img/")
  .load(["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"]);
scene.environment = environmentTexture;
scene.background = environmentTexture;

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.01,
  100,
);
camera.position.set(0, 0, 2);

const pivot = new THREE.Object3D();
pivot.position.set(0, 1, 10);

const yaw = new THREE.Object3D();
const pitch = new THREE.Object3D();

scene.add(pivot);
pivot.add(yaw);
yaw.add(pitch);
pitch.add(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// const progressBar = <HTMLInputElement>document.getElementById("progressBar");

const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

const groundMaterial = new CANNON.Material("groundMaterial");
const slipperyMaterial = new CANNON.Material("slipperyMaterial");
const slippery_ground_cm = new CANNON.ContactMaterial(
  groundMaterial,
  slipperyMaterial,
  {
    friction: 0,
    restitution: 0.3,
    contactEquationStiffness: 1e8,
    contactEquationRelaxation: 3,
  },
);
world.addContactMaterial(slippery_ground_cm);

// character collider
const characterCollider = new THREE.Object3D();
characterCollider.position.y = 3;
scene.add(characterCollider);
const colliderShape = new CANNON.Sphere(0.5);
const colliderBody = new CANNON.Body({ mass: 1, material: slipperyMaterial });
colliderBody.addShape(colliderShape, new CANNON.Vec3(0, 0.5, 0));
colliderBody.addShape(colliderShape, new CANNON.Vec3(0, -0.5, 0));
colliderBody.position.set(
  characterCollider.position.x,
  characterCollider.position.y,
  characterCollider.position.z,
);
colliderBody.linearDamping = 0.95;
colliderBody.angularFactor.set(0, 1, 0); // prevents rotation X,Z axis
world.addBody(colliderBody);

let mixer: THREE.AnimationMixer;
let modelReady = false;
let modelMesh: THREE.Object3D<THREE.Object3DEventMap>;
const animationActions: THREE.AnimationAction[] = [];
let activeAction: THREE.AnimationAction;
let lastAction: THREE.AnimationAction;

const gltfLoader = new GLTFLoader();

// load skinned character model
gltfLoader.load(
  "/models/joe$@idle.glb",
  (gltf) => {
    gltf.scene.traverse(function (child) {
      if ((child as Mesh).isMesh) {
        let m = child as THREE.Mesh;
        m.receiveShadow = true;
        m.castShadow = true;
        m.frustumCulled = false;
        m.geometry.computeVertexNormals();
        if ((child as Mesh).material) {
          const mat = (child as Mesh).material as THREE.MeshStandardMaterial;
          mat.transparent = false;
          mat.side = THREE.FrontSide;
        }
      }
    });
    mixer = new THREE.AnimationMixer(gltf.scene);
    let animationAction = mixer.clipAction(gltf.animations[0]);
    animationActions.push(animationAction);
    activeAction = animationActions[0];

    scene.add(gltf.scene);
    modelMesh = gltf.scene;
    light1.target = modelMesh;

    // load unskinned character model animations
    gltfLoader.load(
      "/models/joe@walking.glb",
      (gltf) => {
        console.log("loaded Joe walking");
        let animationAction = mixer.clipAction(gltf.animations[0]);
        animationActions.push(animationAction);

        gltfLoader.load(
          "/models/joe@jump.glb",
          (gltf) => {
            console.log("loaded Joe jumping");
            let animationAction = mixer.clipAction(gltf.animations[0]);
            animationActions.push(animationAction);
            // progressBar.style.display = 'none'

            gltfLoader.load(
              "/models/joe@fallingLanding.glb",
              (gltf) => {
                console.log("loaded Joe falling landing");
                let animationAction = mixer.clipAction(gltf.animations[0]);
                animationActions.push(animationAction);
                //progressBar.style.display = 'none'

                gltfLoader.load(
                  "/models/joe@fallingIdle.glb",
                  (gltf) => {
                    console.log("loaded Joe falling idle");
                    let animationAction = mixer.clipAction(gltf.animations[0]);
                    animationActions.push(animationAction);
                    //progressBar.style.display = 'none'
                    // console.log("animationActions: ", animationActions);

                    gltfLoader.load(
                      "/models/joe@fastRun.glb",
                      (gltf) => {
                        console.log("loaded Joe fast running");
                        let animationAction = mixer.clipAction(
                          gltf.animations[0],
                        );
                        animationActions.push(animationAction);
                        //progressBar.style.display = 'none'
                        modelReady = true;
                        animationActions[0].play();
                        // setAction(animationActions[0], true);
                        console.log("animationActions: ", animationActions);
                      },
                      (xhr) => {
                        if (xhr.lengthComputable) {
                          //const percentComplete = (xhr.loaded / xhr.total) * 100
                          //progressBar.value = percentComplete
                          //progressBar.style.display = 'block'
                        }
                      },
                      (error) => {
                        console.log(error);
                      },
                    );
                  },
                  (xhr) => {
                    if (xhr.lengthComputable) {
                      //const percentComplete = (xhr.loaded / xhr.total) * 100
                      //progressBar.value = percentComplete
                      //progressBar.style.display = 'block'
                    }
                  },
                  (error) => {
                    console.log(error);
                  },
                );
              },
              (xhr) => {
                if (xhr.lengthComputable) {
                  //const percentComplete = (xhr.loaded / xhr.total) * 100
                  //progressBar.value = percentComplete
                  //progressBar.style.display = 'block'
                }
              },
              (error) => {
                console.log(error);
              },
            );
          },
          (xhr) => {
            if (xhr.lengthComputable) {
              //const percentComplete = (xhr.loaded / xhr.total) * 100
              //progressBar.value = percentComplete
              //progressBar.style.display = 'block'
            }
          },
          (error) => {
            console.log(error);
          },
        );
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          //const percentComplete = (xhr.loaded / xhr.total) * 100
          //progressBar.value = percentComplete
          //progressBar.style.display = 'block'
        }
      },
      (error) => {
        console.log(error);
      },
    );
  },
  (xhr) => {
    if (xhr.lengthComputable) {
      //const percentComplete = (xhr.loaded / xhr.total) * 100
      //progressBar.value = percentComplete
      //progressBar.style.display = 'block'
    }
  },
  (error) => {
    console.log(error);
  },
);

let moveRun = false;

const setAction = (toAction: THREE.AnimationAction, loop: boolean) => {
  mixer.addEventListener("finished", function () {
    if (activeAction === animationActions[2]) {
      setAction(animationActions[4], true);
    } else if (activeAction === animationActions[3]) {
      // setAction(animationActions[1], true);
      if (moveRun) {
        setAction(animationActions[5], true);
      } else {
        setAction(animationActions[1], true);
      }
    }
  });
  if (toAction != activeAction) {
    lastAction = activeAction;
    activeAction = toAction;
    lastAction.fadeOut(0.1);
    activeAction.reset();
    activeAction.fadeIn(0.1);
    activeAction.play();
    if (!loop) {
      activeAction.clampWhenFinished = true;
      activeAction.loop = THREE.LoopOnce;
    }
  }
};

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = true;
const contactNormal = new CANNON.Vec3();
const upAxis = new CANNON.Vec3(0, 1, 0);
colliderBody.addEventListener("collide", function (e: { contact: any }) {
  const contact = e.contact;
  if (contact.bi.id == colliderBody.id) {
    console.log("negating - contact.ni.negate(contactNormal)");
    contact.ni.negate(contactNormal);
  } else {
    contactNormal.copy(contact.ni);
  }
  if (contactNormal.dot(upAxis) > 0.5) {
    if (!canJump) {
      setAction(animationActions[3], false);
    }
    canJump = true;
  }
});

const planeGeometry = new THREE.PlaneGeometry(250, 250);
const plane = new THREE.Mesh(
  planeGeometry,
  new THREE.MeshStandardMaterial({ color: "white" }),
);
plane.rotateX(-Math.PI / 2);
plane.receiveShadow = true;
scene.add(plane);
const planeShape = new CANNON.Plane();
const planeBody = new CANNON.Body({ mass: 0, material: groundMaterial });
planeBody.addShape(planeShape);
planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(planeBody);

const boxes: CANNON.Body[] = [];
const boxMeshes:
  | {
      quaternion: { set: (arg0: any, arg1: any, arg2: any, arg3: any) => void };
    }[]
  | THREE.Mesh<
      THREE.BoxGeometry,
      THREE.MeshStandardMaterial,
      THREE.Object3DEventMap
    >[] = [];
for (let i = 0; i < 150; i++) {
  const halfExtents = new CANNON.Vec3(
    i < 100 ? Math.random() + 0.75 * 8 : Math.random() * 10,
    i < 100 ? Math.random() + 0.5 * 8 : Math.random() * 12,
    i < 100 ? Math.random() + 0.25 * 8 : Math.random() * 8,
  );
  const boxShape = new CANNON.Box(halfExtents);
  const boxGeometry = new THREE.BoxGeometry(
    halfExtents.x * 2,
    halfExtents.y * 2,
    halfExtents.z * 2,
  );
  const x = i < 100 ? Math.random() * 10 : -50;
  const y = 100 + i * 20;
  const z = i < 100 ? 50 + Math.random() * 10 : 50;
  const boxBody = new CANNON.Body({ mass: 1, material: groundMaterial });
  boxBody.addShape(boxShape);
  const boxMesh = new THREE.Mesh(
    boxGeometry,
    new THREE.MeshStandardMaterial({ color: "lightGrey" }),
  );
  world.addBody(boxBody);
  scene.add(boxMesh);
  boxBody.position.set(x, y, z);
  boxMesh.castShadow = true;
  boxMesh.receiveShadow = true;
  boxes.push(boxBody);
  boxMeshes.push(boxMesh);
}

window.addEventListener("resize", onWindowResize, false);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

function onDocumentMouseMove(e: {
  preventDefault: () => void;
  movementX: number;
  movementY: number;
}) {
  e.preventDefault();
  yaw.rotation.y -= e.movementX * 0.002;
  const v = pitch.rotation.x - e.movementY * 0.002;
  if (v > -1 && v < 0.1) {
    pitch.rotation.x = v;
  }
}

function onDocumentMouseWheel(e: {
  preventDefault: () => void;
  deltaY: number;
}) {
  e.preventDefault();
  const v = camera.position.z + e.deltaY * 0.005;
  if (v >= 0.5 && v <= 5) {
    camera.position.z = v;
  }
}

const menuPanel = document.getElementById("menuPanel");
const startButton = document.getElementById("startButton");
startButton?.addEventListener(
  "click",
  () => {
    renderer.domElement.requestPointerLock();
  },
  false,
);

let pointerLocked = false;
document.addEventListener("pointerlockchange", () => {
  if (document.pointerLockElement === renderer.domElement) {
    pointerLocked = true;

    startButton!.style.display = "none";
    menuPanel!.style.display = "none";

    document.addEventListener("keydown", onDocumentKey, false);
    document.addEventListener("keyup", onDocumentKey, false);

    renderer.domElement.addEventListener(
      "mousemove",
      onDocumentMouseMove,
      false,
    );
    renderer.domElement.addEventListener("wheel", onDocumentMouseWheel, false);
  } else {
    menuPanel!.style.display = "block";

    document.removeEventListener("keydown", onDocumentKey, false);
    document.removeEventListener("keyup", onDocumentKey, false);

    renderer.domElement.removeEventListener(
      "mousemove",
      onDocumentMouseMove,
      false,
    );
    renderer.domElement.removeEventListener(
      "wheel",
      onDocumentMouseWheel,
      false,
    );

    setTimeout(() => {
      startButton!.style.display = "block";
    }, 1000);
  }
});

interface IKeyMap {
  KeyW: any;
  KeyS: any;
  KeyA: any;
  KeyD: any;
  Space: any;
  ShiftLeft: any;
}

const keyMap: IKeyMap = {
  KeyW: false,
  KeyS: false,
  KeyA: false,
  KeyD: false,
  Space: false,
  ShiftLeft: false,
};

const onDocumentKey = (e: { code: string | number; type: string }) => {
  keyMap[e.code as keyof IKeyMap] = e.type === "keydown";
  console.log(e);
  if (pointerLocked) {
    moveForward = keyMap["KeyW"];
    console.log("moveForward: ", moveForward);
    moveBackward = keyMap["KeyS"];
    console.log("moveBackward: ", moveBackward);
    moveLeft = keyMap["KeyA"];
    console.log("moveLeft: ", moveLeft);
    moveRight = keyMap["KeyD"];
    console.log("moveRight: ", moveRight);
    if (keyMap["Space"]) {
      if (canJump === true) {
        colliderBody.velocity.y = 50;
        setAction(animationActions[2], false);
      }
      canJump = false;
    }
    if (
      activeAction != animationActions[2] &&
      activeAction != animationActions[3] &&
      activeAction != animationActions[4]
    ) {
      if (keyMap["ShiftLeft"]) {
        moveRun = true;
        setAction(animationActions[5], true);
      } else {
        moveRun = false;
        setAction(animationActions[1], true);
      }
      if (!moveForward && !moveBackward && !moveLeft && !moveRight) {
        setAction(animationActions[0], true);
      }
    }
  }
};

const inputVelocity = new THREE.Vector3();
const velocity = new CANNON.Vec3();
const euler = new THREE.Euler();
const quat = new THREE.Quaternion();
const v = new THREE.Vector3();
const targetQuaternion = new THREE.Quaternion();
let distance = 0;

// const stats = new Stats();
// document.body.appendChild(stats.dom);

const clock = new THREE.Clock();
let delta = 0;

function animate() {
  requestAnimationFrame(animate);

  if (modelReady) {
    if (canJump) {
      if (
        activeAction === animationActions[0] ||
        activeAction === animationActions[3]
      ) {
        // idle
        mixer.update(delta);
      } else {
        // walking
        mixer.update(distance / 10);
      }
    } else {
      // mid-jump
      mixer.update(delta);
    }
    const p = characterCollider.position;
    p.y -= 1;
    modelMesh.position.y = characterCollider.position.y;
    distance = modelMesh.position.distanceTo(p);

    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.lookAt(p, modelMesh.position, modelMesh.up);
    targetQuaternion.setFromRotationMatrix(rotationMatrix);

    if (!modelMesh.quaternion.equals(targetQuaternion)) {
      modelMesh.quaternion.rotateTowards(targetQuaternion, delta * 10);
    }

    if (canJump) {
      inputVelocity.set(0, 0, 0);

      if (moveForward) {
        inputVelocity.z = -10;
      }
      if (moveBackward) {
        inputVelocity.z = 10;
      }

      if (moveLeft) {
        inputVelocity.x = -10;
      }
      if (moveRight) {
        inputVelocity.x = 10;
      }

      if (moveRun) {
        inputVelocity.setLength(delta * 5); // 10
      } else {
        inputVelocity.setLength(delta * 5); // 10
      }

      // apply camera rotation to inputVelocity
      euler.y = yaw.rotation.y;
      euler.order = "XYZ";
      quat.setFromEuler(euler);
      inputVelocity.applyQuaternion(quat);
    }

    modelMesh.position.lerp(characterCollider.position, 0.1);
  }
  velocity.set(inputVelocity.x, inputVelocity.y, inputVelocity.z);
  colliderBody.applyImpulse(velocity);

  delta = Math.min(clock.getDelta(), 0.1);
  world.step(delta);

  characterCollider.position.set(
    colliderBody.position.x,
    colliderBody.position.y,
    colliderBody.position.z,
  );
  boxes.forEach((b, i) => {
    (boxMeshes[i] as Mesh).position.set(
      b.position.x,
      b.position.y,
      b.position.z,
    );
    boxMeshes[i].quaternion.set(
      b.quaternion.x,
      b.quaternion.y,
      b.quaternion.z,
      b.quaternion.w,
    );
  });

  characterCollider.getWorldPosition(v);
  pivot.position.lerp(v, 0.1);

  render();

  // stats.update();
}

function render() {
  renderer.render(scene, camera);
}

animate();
