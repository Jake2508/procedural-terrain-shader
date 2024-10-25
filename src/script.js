import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { SUBTRACTION, Evaluator, Brush } from 'three-bvh-csg'
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import GUI from 'lil-gui'
import terrainVertexShader from './shaders/includes/terrain/vertex.glsl';
import terrainFragmentShader from './shaders/includes/terrain/fragment.glsl';

// Add Brush Import - as a tech section
// GLSL Shaders

/**
 * Base
 */
// Debug
const gui = new GUI({ width: 325 })
const debugObject = {}

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Loaders
const rgbeLoader = new RGBELoader()

/**
 * Environment map
 */
rgbeLoader.load('/spruit_sunrise.hdr', (environmentMap) =>
{
    environmentMap.mapping = THREE.EquirectangularReflectionMapping
    scene.backgroundBlurriness = 0.5
    scene.environment = environmentMap
    scene.background = new THREE.Color(0x87CEEB); // sky blue
})


/**
 * Terrain
 */
// Geometry (500 500 is subdivision amount(careful with values))
const geometry = new THREE.PlaneGeometry(10, 10, 500, 500)
// Delete attributes not required (improves perf)
geometry.deleteAttribute('uv')
geometry.deleteAttribute('normal')
geometry.rotateX(- Math.PI * 0.5)

// Material
debugObject.colorWaterDeep = '#002b3d'
debugObject.colorWaterSurface = '#66a8ff'
debugObject.colorSand = '#ffe894'
debugObject.colorGrass = '#85d534'
debugObject.colorSnow = '#ffffff'
debugObject.colorRock = '#bfbd8d'

const uniforms = {
    uTime: new THREE.Uniform(0),
    uPositionFrequency: new THREE.Uniform(0.225),
    uStrength: new THREE.Uniform(2.625),
    uWarpFrequency: new THREE.Uniform(1.25),
    uWarpStrength: new THREE.Uniform(0.245),

    uColorWaterDeep: new THREE.Uniform(new THREE.Color(debugObject.colorWaterDeep)),
    uColorWaterSurface: new THREE.Uniform(new THREE.Color(debugObject.colorWaterSurface)),
    uColorSand: new THREE.Uniform(new THREE.Color(debugObject.colorSand)),
    uColorGrass: new THREE.Uniform(new THREE.Color(debugObject.colorGrass)),
    uColorSnow: new THREE.Uniform(new THREE.Color(debugObject.colorSnow)),
    uColorRock: new THREE.Uniform(new THREE.Color(debugObject.colorRock)),
}
// Editor vars
gui.add(uniforms.uPositionFrequency, 'value', 0, 1, 0.001).name('uPositionFrequency');
gui.add(uniforms.uStrength, 'value', 0, 10, 0.001).name('uStrength');
gui.add(uniforms.uWarpFrequency, 'value', 0, 10, 0.001).name('uWarpFrequency');
gui.add(uniforms.uWarpStrength, 'value', 0, 1, 0.001).name('uWarpStrength');

gui.addColor(debugObject, 'colorWaterDeep').onChange(() => uniforms.uColorWaterDeep.value.set(debugObject.colorWaterDeep))
gui.addColor(debugObject, 'colorWaterSurface').onChange(() => uniforms.uColorWaterSurface.value.set(debugObject.colorWaterSurface))
gui.addColor(debugObject, 'colorSand').onChange(() => uniforms.uColorSand.value.set(debugObject.colorSand))
gui.addColor(debugObject, 'colorGrass').onChange(() => uniforms.uColorGrass.value.set(debugObject.colorGrass))
gui.addColor(debugObject, 'colorSnow').onChange(() => uniforms.uColorSnow.value.set(debugObject.colorSnow))
gui.addColor(debugObject, 'colorRock').onChange(() => uniforms.uColorRock.value.set(debugObject.colorRock))

const material = new CustomShaderMaterial({
    // CSM 
    baseMaterial: THREE.MeshStandardMaterial,
    vertexShader: terrainVertexShader,
    fragmentShader: terrainFragmentShader,
    uniforms: uniforms,
    silent: true,

    // MeshStandardMaterial
    metalness: 0, roughness: 0.5, color: '#85d534'
})

const depthMaterial = new THREE.MeshDepthMaterial({
    // CSM 
    baseMaterial: THREE.MeshStandardMaterial,
    vertexShader: terrainVertexShader,
    uniforms: uniforms,
    silent: true,

    // MeshDepthMaterial
    depthPacking: THREE.RGBADepthPacking
})

// Mesh
const terrain = new THREE.Mesh(geometry, material)
terrain.customDepthMaterial = depthMaterial
terrain.receiveShadow = true
terrain.castShadow = true
scene.add(terrain)

/**
 * Water
 */
const water = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10, 1, 1),
    new THREE.MeshPhysicalMaterial({
        transmission: 1, roughness: 0.3
    })
)
water.rotation.x = - Math.PI * 0.5
water.position.y = - 0.1
scene.add(water)

/**
 * Wood
 */
const textureLoader = new THREE.TextureLoader();
const woodTexture = textureLoader.load('textures/wood_plank.png'); // Replace with the path to your wood texture

// Create the wood material
const woodMaterial = new THREE.MeshStandardMaterial({
    map: woodTexture, metalness: 0.1, roughness: 0.6, color: 0xffffff          
});

/**
 * Boards (Sandbox)
 */
// Brushes
const boardFill = new Brush(new THREE.BoxGeometry(11, 2, 11))
const boardHole = new Brush(new THREE.BoxGeometry(10, 2.1, 10))

// Evaluate
const evaluator = new Evaluator()
const board = evaluator.evaluate(boardFill, boardHole, SUBTRACTION)
board.geometry.clearGroups()
board.material = woodMaterial;
board.castShadow = true
board.receiveShadow = true
scene.add(board)

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 2.15)
directionalLight.position.set(6.25, 3, 4)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.near = 0.1
directionalLight.shadow.camera.far = 30
directionalLight.shadow.camera.top = 8
directionalLight.shadow.camera.right = 8
directionalLight.shadow.camera.bottom = -8
directionalLight.shadow.camera.left = -8
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(sizes.pixelRatio)
})

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.set(-10, 6, -2)
scene.add(camera)

/**
 * Orbit Controls
 */
const controls = new OrbitControls(camera, canvas)
controls.enablePan = false;
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.maxPolarAngle = Math.PI / 2 - 0.2;
controls.minDistance = 5;   
controls.maxDistance = 45; 

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.shadowMap.enabled = true 
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.7
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Uniforms
    uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()