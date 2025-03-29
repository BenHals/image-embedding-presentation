<script setup lang="ts">

import { ref, onMounted, shallowRef } from 'vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import fragment from './shaders/TitleEmbedding/fragment.js'
import vertex from './shaders/TitleEmbedding/vertex.js'

const customCanvas = shallowRef<HTMLCanvasElement | null>(null)
const canvasContainer = shallowRef<HTMLDivElement | null>(null)

const threeData: {scene: THREE.Scene, camera: THREE.Camera, raycaster: THREE.Raycaster, renderer: THREE.WebGLRenderer | null} = {
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(),
    raycaster: new THREE.Raycaster(),
    renderer: null,
}


const sceneData: {meshes: THREE.Mesh[], pointer: THREE.PointLight, plane: THREE.Mesh, time: number} = {
    meshes: [],
    pointer: new THREE.PointLight( 0xff0000, 10000),
    plane: new THREE.Mesh( new THREE.PlaneGeometry(10, 10), new THREE.MeshPhongMaterial( { color: 0x0000ff } ) ),
    time: 0.0
}

const textureUrls = {
    particle: {
        url: '/textures/img.jpeg',
        data: undefined
    },
    img1: {
        url: '/textures/img.jpeg',
        data: undefined
    }
}

const pointer = new THREE.Vector2();

onMounted(() => {
    const textureLoader = new THREE.TextureLoader()
    const texturePromises = []
    for (const texKey in textureUrls) {
        texturePromises.push(new Promise((resolve, reject) => {
            textureLoader.load(textureUrls[texKey].url, 
                texture => {
                    textureUrls[texKey].data = texture;
                    resolve(textureUrls[texKey])
                },
                xhr => {
                  console.log(url + ' ' + (xhr.loaded / xhr.total * 100) +
                    '% loaded');
                },
                xhr => {
                    console.log(xhr)
                  reject(new Error(xhr +
                    'An error occurred loading while loading: ' +
                    textureUrls[texKey].url));
                }
            )
        }));
    }
    Promise.all(texturePromises).then(loadedTextures => {
        console.log('loaded')
        threeData.scene = new THREE.Scene();

        let w = canvasContainer.value!.offsetWidth;
        let h = canvasContainer.value!.offsetHeight;
        const bb = canvasContainer.value!.getBoundingClientRect()
        console.log(w, h, bb)
        const aspectRatio = w / h;
        const xScale = bb.width / w * 1.0
        const yScale = bb.height / h * 1.0
        console.log(xScale, yScale, window.devicePixelRatio)
        const near = 0.1;
        const far = 5000;
        const n_particles = 256;
        

        threeData.camera = new THREE.PerspectiveCamera(
          25,  // Field of view
          aspectRatio,
          near,  // Near plane
          far  // Far plane
        )

        threeData.renderer = new THREE.WebGLRenderer( { canvas: customCanvas.value!, antialias: true } );
        threeData.renderer.setSize(w, h);
        threeData.renderer.setPixelRatio(xScale);
        threeData.renderer.setClearColor( 0xCCCCCC, 1.0)


        // const geometryPlane = new THREE.PlaneGeometry(10, 10)
        // const materialPlace = new THREE.MeshBasicMaterial({map: textureUrls.img1.data})
        // threeData.scene.add(new THREE.Mesh(geometryPlane, materialPlace));
        const geometry = new THREE.BufferGeometry()
        const positions = new THREE.BufferAttribute(
            new Float32Array(n_particles * n_particles * 3),
            3,
        )
        const imgCoords = new THREE.BufferAttribute(
            new Float32Array(n_particles * n_particles * 2),
            2,
        )
        for (const x of Array(n_particles).keys()){
            for (const y of Array(n_particles).keys()) {
                const idx = x*n_particles + y;
                positions.setXYZ(idx, (x / n_particles) * w - (w/2), (y / n_particles) * h - (h/2), 0.0)
                imgCoords.setXY(idx, x, y)
            
            }
        }
        console.log(positions)
        geometry.setAttribute("position", positions)
        geometry.setAttribute("imgCoord", imgCoords)
        const material = new THREE.ShaderMaterial({
            fragmentShader: fragment,
            vertexShader: vertex,
            uniforms: {
                time: {type: "f", value: sceneData.time },
                t1: {type: "t", value: textureUrls.particle.data},
                t2: {type: "t", value: textureUrls.img1.data },
            }
        })
        console.log(material.uniforms)
        const cube = new THREE.Points( geometry, material );
        threeData.scene.add( cube );
        sceneData.meshes.push(cube)

        threeData.camera.position.z = 1500;
        customCanvas.value!.addEventListener( 'mousemove', onPointerMove );
        let controls = new OrbitControls( threeData.camera, threeData.renderer.domElement );
        requestAnimationFrame(animate)
    })
}
)

function animate() {
    sceneData.time += 1
    threeData.raycaster.setFromCamera( pointer, threeData.camera );
    // sceneData.meshes[0].rotation.y = sceneData.time * 0.05
    sceneData.meshes[0].material.uniforms.time.value = sceneData.time

    const intersections = threeData.raycaster.intersectObjects( [sceneData.plane], false );
    let intersection = ( intersections.length ) > 0 ? intersections[ 0 ] : null;
    if ( intersection ) {
        let p: {x: number, y: number, z: number} = {
            x: intersection.point.x,
            y: intersection.point.y,
            z: intersection.point.z + 1.0,
        }
        sceneData.pointer.position.copy( p );
    }



    threeData.renderer!.render(threeData.scene, threeData.camera)
    requestAnimationFrame(animate)
}

function onPointerMove( event: MouseEvent ) {
    pointer.x = ( event.offsetX / customCanvas.value!.width ) * 2 - 1;
    pointer.y = - ( event.offsetY / customCanvas.value!.height) * 2 + 1;
}

</script>

<template>
    <div flex="~ col" w="min" border="~ main rounded-md" ref="canvasContainer"
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
        <canvas ref="customCanvas" id='test' style="width: 100%; height: 100%;">
        </canvas>
    </div>
</template>
