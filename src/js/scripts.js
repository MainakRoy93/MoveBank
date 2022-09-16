import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js' 
import vertexShader from '../shaders/vertex/globeVertex.glsl'
import fragmentShader from '../shaders/fragment/globeFragment.glsl'
// console.log(vertexShader)


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth/window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGL1Renderer({
    "antialias":true
});

renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(5,250,250),
    // new THREE.MeshBasicMaterial({
    //     map : new THREE.TextureLoader().load(require('../img/8081_earthmap10k.jpg'))
    // })
    new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms :{
            globeTexture : {
                value : new THREE.TextureLoader().load(require('../img/8081_earthmap10k.jpg'))
            }
        }
    })
)

scene.add(sphere)

camera.position.set(0,0,10)

function animate() {

	requestAnimationFrame( animate );
	renderer.render( scene, camera );

}
animate();

// const orbit =  new OrbitControls(camera, renderer.domElement)
// const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);
// camera.position.set(2,1,8);
// // console.log(orbit);
// orbit.update();



