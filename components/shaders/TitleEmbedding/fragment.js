const fragment = /* glsl */ `
varying vec2 vUv;
varying vec2 vCoordinates;
uniform float time;
uniform float periodicTransform;
uniform float periodicTransformTrailing;
uniform sampler2D t1;
uniform sampler2D t2;
varying vec4 posRandV;

void main() {
    vec2 myUV = vec2(vCoordinates.x / 512.0, vCoordinates.y/512.);
    vec4 maskTexture = texture2D(t1, gl_PointCoord);
    vec4 image = texture2D(t2, myUV);

    float transformTime = (1.0 - posRandV.z) * periodicTransform + (posRandV.z * periodicTransformTrailing);

    vec2 transitionStateRange = vec2(0.5, 0.7);

    float transitionStateP = (transformTime - transitionStateRange.x) / (transitionStateRange.y - transitionStateRange.x);

    float g = ((1.0 * time) - (255.0 * floor(1.0*time / 255.0))) / 255.0;
    vec3 imgColor = vec3(
        image.rgb
    );
    float c1 = step(0.0, posRandV.w) * (1. - step(0.3, posRandV.w));
    float c2 = step(0.3, posRandV.w) * (1. - step(0.7, posRandV.w));
    float c3 = step(0.7, posRandV.w) * (1. - step(1.0, posRandV.w));
    float lightness = 0.5 * c1 + 0.0 * c2 + 1.0 * c3;
    vec3 flowColor = vec3(
        lightness,
        lightness,
        lightness
    );
    vec3 periodicColor = (clamp(transitionStateP*2., 0.0, 1.0))*imgColor + (1. - clamp(transitionStateP*2., 0.0, 1.0))*flowColor;
    gl_FragColor = vec4(periodicColor.rgb, maskTexture.r);

}
`;

export default fragment;
