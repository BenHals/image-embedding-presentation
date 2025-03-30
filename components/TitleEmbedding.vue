<script setup lang="ts">

import { ref, onMounted, shallowRef } from 'vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import fragment from './shaders/TitleEmbedding/fragment.js'
import vertex from './shaders/TitleEmbedding/vertex.js'

const customCanvas = shallowRef<HTMLCanvasElement | null>(null)
const canvasContainer = shallowRef<HTMLDivElement | null>(null)

const near = 0.01;
const far = 20000;
const n_particles = 512;

const threeData: { scene: THREE.Scene, camera: THREE.Camera, raycaster: THREE.Raycaster, renderer: THREE.WebGLRenderer | null } = {
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(),
    raycaster: new THREE.Raycaster(),
    renderer: null,
}

const sceneData: { particles: THREE.Points | null, mousePlane: THREE.Mesh, pointer: THREE.Mesh, plane: THREE.Mesh, time: number } = {
    particles: null,
    mousePlane: new THREE.Mesh(new THREE.PlaneGeometry(2000, 3000), new THREE.MeshBasicMaterial()),
    pointer: new THREE.Mesh(new THREE.SphereGeometry(20), new THREE.MeshBasicMaterial({ color: 0xff0000 })),
    plane: new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshPhongMaterial({ color: 0x0000ff })),
    time: 0.0
}
const textures: { [key: string]: { url: string, data: any } } = {
    particle: {
        url: '/textures/particle.png',
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
    const texturePromises: Promise<any>[] = []
    for (const texKey in textures) {
        const entry = textures[texKey]
        texturePromises.push(new Promise((resolve, reject) => {
            textureLoader.load(entry.url,
                texture => {
                    entry.data = texture;
                    resolve(entry)
                },
                xhr => {
                    console.log(entry.url + ' ' + (xhr.loaded / xhr.total * 100) +
                        '% loaded');
                },
                xhr => {
                    console.log(xhr)
                    reject(new Error(xhr +
                        'An error occurred loading while loading: ' +
                        entry.url));
                }
            )
        }));
    }
    Promise.all(texturePromises).then(_ => {
        console.log('loaded')
        threeData.scene = new THREE.Scene();

        let w = canvasContainer.value!.offsetWidth;
        let h = canvasContainer.value!.offsetHeight;
        const bb = canvasContainer.value!.getBoundingClientRect()
        const aspectRatio = w / h;
        const xScale = bb.width / w * 1.0


        threeData.camera = new THREE.PerspectiveCamera(
            25,  // Field of view
            aspectRatio,
            near,  // Near plane
            far  // Far plane
        )

        threeData.renderer = new THREE.WebGLRenderer({ canvas: customCanvas.value!, antialias: true });
        threeData.renderer.setSize(w, h);
        threeData.renderer.setPixelRatio(xScale);
        threeData.renderer.setClearColor(0xCCCCCC, 1.0)


        const geometry = new THREE.BufferGeometry()
        const positions = new THREE.BufferAttribute(
            new Float32Array(n_particles * n_particles * 3),
            3,
        )
        const imgCoords = new THREE.BufferAttribute(
            new Float32Array(n_particles * n_particles * 2),
            2,
        )
        for (const x of Array(n_particles).keys()) {
            for (const y of Array(n_particles).keys()) {
                const idx = x * n_particles + y;
                positions.setXYZ(idx, (x / n_particles) * w - (w / 2), (y / n_particles) * h - (h / 2), 0.0)
                imgCoords.setXY(idx, x, y)

            }
        }
        geometry.setAttribute("position", positions)
        geometry.setAttribute("imgCoord", imgCoords)
        const material = new THREE.ShaderMaterial({
            fragmentShader: fragment,
            vertexShader: vertex,
            uniforms: {
                time: { type: "f", value: sceneData.time },
                t1: { type: "t", value: textures.particle.data },
                t2: { type: "t", value: textures.img1.data },
            },
            transparent: true,
        })
        material.blending = THREE.NormalBlending
        material.side = THREE.DoubleSide
        sceneData.particles = new THREE.Points(geometry, material);
        threeData.scene.add(sceneData.particles);

        threeData.scene.add(sceneData.pointer)

        threeData.camera.position.z = 1500;
        customCanvas.value!.addEventListener('mousemove', onPointerMove);
        let controls = new OrbitControls(threeData.camera, threeData.renderer.domElement);
        requestAnimationFrame(animate)
    })
}
)

function animate() {
    sceneData.time += 1
    threeData.raycaster.setFromCamera(pointer, threeData.camera);
    // sceneData.meshes[0].rotation.y = sceneData.time * 0.05
    sceneData.particles.material.uniforms.time.value = sceneData.time

    const intersections = threeData.raycaster.intersectObjects([sceneData.mousePlane], false);
    let intersection = (intersections.length) > 0 ? intersections[0] : null;
    if (intersection) {
        let p: { x: number, y: number, z: number } = {
            x: intersection.point.x,
            y: intersection.point.y,
            z: intersection.point.z + 1.0,
        }
        sceneData.pointer.position.copy(p);
    }



    threeData.renderer!.render(threeData.scene, threeData.camera)
    requestAnimationFrame(animate)
}

function onPointerMove(event: MouseEvent) {
    const bb = canvasContainer.value!.getBoundingClientRect()
    const w = canvasContainer.value!.offsetWidth;
    const xScale = bb.width / w * 1.0
    pointer.x = (event.offsetX * xScale / bb.width) * 2 - 1;
    pointer.y = -((event.offsetY * xScale / bb.height) * 2 - 1);
    console.log(pointer.x, pointer.y)
}

</script>

<template>
    <div flex="~ col" w="min" border="~ main rounded-md" ref="canvasContainer"
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
        <canvas ref="customCanvas" id='test' style="width: 100%; height: 100%;">
        </canvas>
    </div>
</template>
