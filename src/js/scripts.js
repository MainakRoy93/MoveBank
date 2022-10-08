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
import endPointCurves from '../utils/endPointCurves.json'
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
    new THREE.ShaderMaterial({
        vertexShader : atmoshereVertexShader,
        fragmentShader :  atmoshereFragmentShader,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    })
)
atmosphere.scale.set(1.4,1.4,1.4)

class CurveRing{
    constructor(curveStart, curveEnd, controlPoint1, controlPoint2, ringLookAt, curveColor=0xe278de, ringColor=0xffffff, tag="", index=0) {
        this.curveStart = curveStart
        this.curveEnd = curveEnd
        this.controlPoint1 = controlPoint1
        this.controlPoint2 = controlPoint2
        this.ringLookAt = ringLookAt
        this.curveColor = curveColor
        this.ringColor = ringColor
        this.tubeRadius = 0.02
        this.tag=tag
        this.index = index
        this.createCurve()
        this.createTube()
        this.createRing()
    }

    createCurve(){
        this.curveObj = new THREE.CubicBezierCurve3(
            new THREE.Vector3(this.curveStart.x, this.curveStart.y, this.curveStart.z),
            new THREE.Vector3(this.controlPoint1.x, this.controlPoint1.y, this.controlPoint1.z),
            new THREE.Vector3(this.controlPoint2.x, this.controlPoint2.y, this.controlPoint2.z),
            new THREE.Vector3(this.curveEnd.x, this.curveEnd.y, this.curveEnd.z)
        )
    }

    createTube(){
        this.tubeGeometry = new THREE.TubeGeometry(this.curveObj, 128, this.tubeRadius, 8, true)
        this.tubeGeometry.setDrawRange(0,0)
        this.tubeMaterial = new THREE.MeshBasicMaterial( { color: this.curveColor } )
        this.curveTube = new THREE.Mesh( this.tubeGeometry, this.tubeMaterial )
        this.curveTube.layers.enable(1)
        this.totalVertices = this.tubeGeometry.index.count
    }

    createRing(){
         this.ringGeometry = new THREE.RingGeometry( this.tubeRadius, this.tubeRadius + 0.03, 32,2 )
         this.ringGeometry.lookAt(new THREE.Vector3(this.ringLookAt.x, this.ringLookAt.y, this.ringLookAt.z))
         this.ringGeometry.translate(this.curveEnd.x, this.curveEnd.y, this.curveEnd.z)
         this.ringMaterial = new THREE.MeshPhongMaterial({ 
            color: this.ringColor, 
            transparent: true, 
            opacity:0.0,
            blending:THREE.AdditiveBlending, 
            side: THREE.BackSide
        })
        this.ring = new THREE.Mesh( this.ringGeometry, this.ringMaterial )
    }

    addToScene(scene){
        scene.add(this.curveTube)
        scene.add(this.ring)
    }

    rotate(rotationAmount){
        this.ring.rotation.y-= rotationAmount
        this.curveTube.rotation.y -= rotationAmount
    }

    animate(){
        this.displayedVertices = this.tubeGeometry.drawRange.count;
        if (this.displayedVertices >= this.totalVertices){
            this.animation = {o:1}
            this.ring.material.opacity = this.animation.o;
            new TWEEN.Tween(this.animation)
                .to({o:0}, 1200)
                .easing(TWEEN.Easing.Cubic.In)
                .onUpdate(()=>{
                    this.ring.material.side = THREE.FrontSide
                    this.ring.material.opacity = this.animation.o
                })
                .start()
                .onComplete(()=>{
                    this.ring.material.side = THREE.BackSide
                })
            this.displayedVertices=1;
        }
        this.tubeGeometry.setDrawRange(0, this.displayedVertices+24);
    }
}

const canadianGeeseCurve0 = new CurveRing(
    endPointCurves.canadianGeese["0"].curveStart,
    endPointCurves.canadianGeese["0"].curveEnd,
    endPointCurves.canadianGeese["0"].controlPoint1,
    endPointCurves.canadianGeese["0"].controlPoint2,
    endPointCurves.canadianGeese["0"].ringLookAt
)


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
			  roughness: .0,
			  transparent: !0,
			  alphaTest: .02,
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
canadianGeeseCurve0.addToScene(scene);
// scene.add(curveTubeMesh);
// scene.add(ringMesh);

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
    // digital_mesh.rotation.y -= 0.0015
    // curveTubeMesh.rotation.y -= 0.0015
    // ringMesh.rotation.y -= 0.0015
    // o.rotation.y -= 0.0015
    renderer.clearDepth();
    camera.layers.set(0);
    canadianGeeseCurve0.animate();
    
    orbit.update()
	renderer.render( scene, camera );
    TWEEN.update()

}
animate();





