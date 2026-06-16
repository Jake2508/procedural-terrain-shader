import * as THREE from 'three'

export function createToonGradientTexture(bands = 4)
{
    const data = new Uint8Array(bands)
    for (let i = 0; i < bands; i++)
        data[i] = Math.round((i / (bands - 1)) * 255)

    const texture = new THREE.DataTexture(data, bands, 1, THREE.RedFormat)
    texture.magFilter = THREE.NearestFilter
    texture.minFilter = THREE.NearestFilter
    texture.generateMipmaps = false
    texture.needsUpdate = true

    return texture
}
