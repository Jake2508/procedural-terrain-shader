uniform float uTime;
uniform float uPositionFrequency;
uniform float uStrength;
uniform float uWarpFrequency;
uniform float uWarpStrength;

varying vec3 vPosition;
varying float vUpDot;

#include ../simplexNoise2d.glsl

float getElevation(vec2 position)
{
    vec2 warpedPosition = position;
    warpedPosition += uTime * 0.2;
    warpedPosition += simplexNoise2d((warpedPosition * uPositionFrequency * uWarpFrequency) * uWarpStrength);

    float elevation = 0.0;
    // Bonus multipliers adds more variation in elevation frequency 
    elevation += simplexNoise2d(warpedPosition * uPositionFrequency      ) / 2.0;
    elevation += simplexNoise2d(warpedPosition * uPositionFrequency * 2.0) / 4.0; 
    elevation += simplexNoise2d(warpedPosition * uPositionFrequency * 4.0) / 8.0;

    // Plateaus - Flat terrain near to water sources
    float elevationSign = sign(elevation);
    elevation = pow(abs(elevation), 2.0) * elevationSign;
    elevation *= uStrength;

    return elevation;
}

void main()
{
    // Neightbour positions
    float shift = 0.01;
    vec3 positionA = position + vec3(shift, 0.0, 0.0);
    vec3 positionB = position + vec3(0.0, 0.0, - shift);

    // Elevation
    float elevation = getElevation(csm_Position.xz);
    csm_Position.y += elevation;
    positionA.y = getElevation(positionA.xz);
    positionB.y = getElevation(positionB.xz);

    // Compute normal
    vec3 toA = normalize(positionA - csm_Position);
    vec3 toB = normalize(positionB - csm_Position);
    csm_Normal = cross(toA, toB);

    // Varying
    vPosition = csm_Position;
    vPosition.xz += uTime * 0.2;
    vUpDot = dot(csm_Normal, vec3(0.0, 1.0, 0.1));
}