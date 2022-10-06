import * as THREE from 'three';
const TWEEN = require('@tweenjs/tween.js')
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js' 
import vertexShader from '../shaders/vertex/globeVertex.glsl'
import fragmentShader from '../shaders/fragment/globeFragment.glsl'
import atmoshereVertexShader from '../shaders/vertex/atmosphereVertex.glsl'
import atmoshereFragmentShader from '../shaders/fragment/atmosphereFragment.glsl' 
import camera_properties from '../utils/camera_properties.json'
import points from '../utils/points.json'
import { MeshLine, MeshLineMaterial, MeshLineRaycast } from 'three.meshline';

// console.log(atmoshereFragmentShader);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth/window.innerHeight,
    0.1,
    1000
);
camera.layers.enable(1);

const renderer = new THREE.WebGL1Renderer({
    "antialias":true
});


renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// const digital_material = new THREE.MeshPhongMaterial({
    // map: new THREE.TextureLoader().load(require('../img/digitalearth_4.jpg')),
    // bumpMap: new THREE.TextureLoader().load(require('../img/8081_earthbump10k.jpg')),
    // specularMap: new THREE.TextureLoader().load(require('../img/8081_earthspec10k.jpg')),
    // bumpScale:1,
// })

const digital_material = new THREE.MeshPhysicalMaterial (
    { 
        color:0x000000, 
        // // transparent:true, 
        // opacity:0.95,
        // roughness:0.373,
        // metalness:1,
        // reflectivity: 0.594,
        // blending: THREE.AdditiveBlending,
        // side: THREE.BackSide
    })

// console.log(digital_material);

const digital_mesh = new THREE.Mesh(new THREE.SphereGeometry(5,250,250), digital_material)

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
const pointLight = new THREE.PointLight(0xffffff,0.5);
pointLight.position.set(5,0,20)

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

// const sphere = new THREE.Mesh(
//     new THREE.SphereGeometry(5,250,250),
//     // new THREE.MeshBasicMaterial({
//     //     map : new THREE.TextureLoader().load(require('../img/8081_earthmap10k.jpg'))
//     // })
//     new THREE.ShaderMaterial({
//         vertexShader,
//         fragmentShader,
//         uniforms :{
//             globeTexture : {
//                 value : new THREE.TextureLoader().load(require('../img/digitalearth_2.jpeg'))
//             }
//         }
//     })
// )

const curve = new THREE.CubicBezierCurve3(
	new THREE.Vector3(0.848886524067191, 4.336771039662556, 2.339189735528369),
	new THREE.Vector3(0.984038572519382,  4.4268565429338675, 2.9316563980244386),
	new THREE.Vector3(1.0400099003236967, 3.8107425376980193,  3.6819316558849327),
	new THREE.Vector3(0.9542093659024761,  3.20031671570197, 3.7212171940404866 )
);

//Using Tube Geom
const curveTubeGeometry = new THREE.TubeGeometry( curve, 40, 0.02, 8, false );
curveTubeGeometry.setDrawRange(0, 1)
const curveTubeMaterial = new THREE.MeshBasicMaterial( { color: 0xe278de } );
const curveTubeMesh = new THREE.Mesh( curveTubeGeometry, curveTubeMaterial );
curveTubeMesh.layers.enable(1);


// Uniform for ring animations, to be used to pass the time to the fragment shader
const ringUniform = {
    "opacity" : {
        type : "f", value: 0.0
    },
    

}
const ringGeometry = new THREE.RingGeometry( 0.02, 0.05, 32,2 );
// const ringGeometry = new THREE.CylinderGeometry( 0.03, 0.01, 0.8, 32 , true);
// ringGeometry.rotateX(THREE.MathUtils.degToRad(39.796543 - 90));
// ringGeometry.rotateY(THREE.MathUtils.degToRad(-75.617867 - 90));
ringGeometry.lookAt(new THREE.Vector3(1.1450512390829712, 3.8403800588423644, 4.4654606328485835))
ringGeometry.translate(0.9542093659024761,  3.20031671570197, 3.7212171940404866);

const ringMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff, transparent: true, opacity:0.0} );
const ringMesh = new THREE.Mesh( ringGeometry, ringMaterial );
ringMesh.layers.enable(1);

function animateCurve(){
    var totalVertices = curveTubeGeometry.index.count;
    var displayedVertices = curveTubeGeometry.drawRange.count;
    if (displayedVertices >= totalVertices){
        curveTubeGeometry.setDrawRange(0, 1);
        // ringMesh.material.transparent = true;
        animation = {o:1}
        ringMesh.material.opacity = animation.o;
        new TWEEN.Tween(animation)
            .to({o:0}, 1200)
            .easing(TWEEN.Easing.Cubic.In)
            .onUpdate(()=>{
                ringMesh.material.opacity = animation.o
                // ringMesh.geometry.scale(animation.x, animation.y, animation.z)
            })
            .start()
        displayedVertices=1;
    }
    curveTubeGeometry.setDrawRange(0, displayedVertices+15);
    
}

const e =  new THREE.Object3D;
i = [];
Object.entries(points).forEach(
    ([key, data]) =>{
        e.position.set(data.position.x, data.position.y, data.position.z);
        e.lookAt(data.lookAt.x, data.lookAt.y, data.lookAt.z);
        e.updateMatrix();
        i.push(e.matrix.clone());
    }
);

const dot = new THREE.CircleGeometry(0.008, 5),
		  dot_mat = new THREE.MeshStandardMaterial({
			  color: 3818644,
            //   color: 0x8561ba,
			  metalness: 0,
			  roughness: .9,
			  transparent: !0,
			  alphaTest: .02
		  });
const o = new THREE.InstancedMesh(dot, dot_mat, i.length);
o.layers.enable(1);
for (let l = 0; l < i.length; l++)
    o.setMatrixAt(l, i[l]);
// o.renderOrder = 3;
//Using Mesh Line
// const curvePoints = curve.getPoints( 50 );
// const curveGeometry = new THREE.BufferGeometry().setFromPoints( curvePoints );
// const curveMeshLine = new MeshLine();
// curveMeshLine.setGeometry(curveGeometry);

// const curveMeshMaterial = new MeshLineMaterial({
//     color:0xe278de,
//     sizeAttenuation : false,
//     lineWidth :0.0045,
//     // transparent : true,
//     // blending: THREE.AdditiveBlending,
//     opacity : 0.9,
//     // resolution : new THREE.Vector2(window.innerWidth, window.innerHeight)

// })

// const curveMeshFinal = new THREE.Mesh(curveMeshLine, curveMeshMaterial)

// console.log(new THREE.SphereGeometry(5,250,250).attributes.normal )
scene.add(digital_mesh)
scene.add(o);
// scene.add(pointMesh);
scene.add(atmosphere)
scene.add(ambientLight)
// scene.add(pointLight)
scene.add(curveTubeMesh);
scene.add(ringMesh);

const orbit =  new OrbitControls(camera, renderer.domElement)
orbit.minDistance = camera_properties.minDistance
orbit.maxDistance = camera_properties.maxDistance
orbit.zoomSpeed = camera_properties.zoomSpeed
orbit.panSpeed = camera_properties.panSpeed
camera.position.set(0,5,6.7)


/** COMPOSER */

renderScene = new RenderPass( scene, camera )
bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 )
bloomPass.threshold = 0.05
bloomPass.strength = 4
bloomPass.radius = 0.3
bloomPass.renderToScreen = true
composer = new EffectComposer( renderer )
composer.setSize( window.innerWidth, window.innerHeight )
	
composer.addPass( renderScene )
/* composer.addPass( effectFXAA ) */
composer.addPass( bloomPass )

function getState(obj){
    var totalVertices = obj.index.count;
    var displayedVertices = obj.drawRange.count;
}

function animate() {

	requestAnimationFrame( animate );
      
    renderer.autoClear = false;
    renderer.clear();
    
    camera.layers.set(1);
    composer.render();
    digital_mesh.rotation.y -= 0.0015
    curveTubeMesh.rotation.y -= 0.0015
    ringMesh.rotation.y -= 0.0015
    o.rotation.y -= 0.0015
    renderer.clearDepth();
    camera.layers.set(0);
    animateCurve();
    
    orbit.update()
	renderer.render( scene, camera );
    TWEEN.update()

}
animate();





