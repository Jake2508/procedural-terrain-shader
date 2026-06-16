uniform vec3 uSkyColorHorizon;
uniform vec3 uSkyColorMid;
uniform vec3 uSkyColorZenith;

varying vec3 vDirection;

void main()
{
    vec3 direction = normalize(vDirection);

    float lowMix = smoothstep(-0.85, -0.45, direction.y);
    vec3 color = mix(uSkyColorHorizon, uSkyColorMid, lowMix);

    float highMix = smoothstep(-0.5, 0.15, direction.y);
    color = mix(color, uSkyColorZenith, highMix);

    gl_FragColor = vec4(color, 1.0);
}
