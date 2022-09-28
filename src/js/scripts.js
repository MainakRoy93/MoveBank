import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js' 
import vertexShader from '../shaders/vertex/globeVertex.glsl'
import fragmentShader from '../shaders/fragment/globeFragment.glsl'
import atmoshereVertexShader from '../shaders/vertex/atmosphereVertex.glsl'
import atmoshereFragmentShader from '../shaders/fragment/atmosphereFragment.glsl' 
import camera_properties from '../utils/camera_properties.json'

console.log(atmoshereFragmentShader);
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

const digital_material = new THREE.MeshPhongMaterial({
    map: new THREE.TextureLoader().load(require('../img/digitalearth_4.jpg')),
    // bumpMap: new THREE.TextureLoader().load(require('../img/8081_earthbump10k.jpg')),
    // specularMap: new THREE.TextureLoader().load(require('../img/8081_earthspec10k.jpg')),
    // bumpScale:1,
})

const digital_mesh = new THREE.Mesh(new THREE.SphereGeometry(5,250,250), digital_material)

const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
const pointLight = new THREE.PointLight(0xffffff,1);
pointLight.position.set(5,0,9)

const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(5,250,250),
    // new THREE.MeshBasicMaterial({
    //     map : new THREE.TextureLoader().load(require('../img/8081_earthmap10k.jpg'))
    // })
    new THREE.ShaderMaterial({
        vertexShader : atmoshereVertexShader,
        fragmentShader :  atmoshereFragmentShader,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    })
)
atmosphere.scale.set(1.4,1.4,1.4)

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
                value : new THREE.TextureLoader().load(require('../img/digitalearth_2.jpeg'))
            }
        }
    })
)

scene.add(digital_mesh)
scene.add(atmosphere)
scene.add(ambientLight)
scene.add(pointLight)

const orbit =  new OrbitControls(camera, renderer.domElement)
orbit.minDistance = camera_properties.minDistance
orbit.maxDistance = camera_properties.maxDistance
orbit.zoomSpeed = camera_properties.zoomSpeed
orbit.panSpeed = camera_properties.panSpeed
camera.position.set(0,0,11)

function animate() {

	requestAnimationFrame( animate );
    digital_mesh.rotation.y -= 0.0015
    orbit.update()
	renderer.render( scene, camera );

}
animate();

// const orbit =  new OrbitControls(camera, renderer.domElement)
// const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);
// camera.position.set(2,1,8);
// // console.log(orbit);
// orbit.update();



