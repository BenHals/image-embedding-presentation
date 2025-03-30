const vertex = /* glsl */ `

varying vec2 vUv;
varying vec2 vCoordinates;
uniform float time;
uniform float periodicTransform;
uniform float periodicTransformTrailing;
attribute vec2 imgCoord;
attribute vec4 posRand;
attribute float posRandX;
attribute float posRandY;
varying vec4 posRandV;

// A single iteration of Bob Jenkins' One-At-A-Time hashing algorithm.
uint hash( uint x ) {
    x += ( x << 10u );
    x ^= ( x >>  6u );
    x += ( x <<  3u );
    x ^= ( x >> 11u );
    x += ( x << 15u );
    return x;
}
// Compound versions of the hashing algorithm I whipped together.
uint hash( uvec2 v ) { return hash( v.x ^ hash(v.y)                         ); }
uint hash( uvec3 v ) { return hash( v.x ^ hash(v.y) ^ hash(v.z)             ); }
uint hash( uvec4 v ) { return hash( v.x ^ hash(v.y) ^ hash(v.z) ^ hash(v.w) ); }

// Construct a float with half-open range [0:1] using low 23 bits.
// All zeroes yields 0.0, all ones yields the next smallest representable value below 1.0.
float floatConstruct( uint m ) {
    const uint ieeeMantissa = 0x007FFFFFu; // binary32 mantissa bitmask
    const uint ieeeOne      = 0x3F800000u; // 1.0 in IEEE binary32
    m &= ieeeMantissa;                     // Keep only mantissa bits (fractional part)
    m |= ieeeOne;                          // Add fractional part to 1.0
    float  f = uintBitsToFloat( m );       // Range [1:2]
    return f - 1.0;                        // Range [0:1]
}
// Pseudo-random value in half-open range [0:1].
float random( float x ) { return floatConstruct(hash(floatBitsToUint(x))); }
float random( vec2  v ) { return floatConstruct(hash(floatBitsToUint(v))); }
float random( vec3  v ) { return floatConstruct(hash(floatBitsToUint(v))); }
float random( vec4  v ) { return floatConstruct(hash(floatBitsToUint(v))); }

void main() {
    vUv = uv;
    posRandV = posRand;
    
    vec2 flowStateRange = vec2(0.0, 0.5);
    vec2 transitionStateRange = vec2(0.5, 0.7);
    vec2 imgStateRange = vec2(0.7, 1.0);

    float transformTime = (1.0 - posRand.z) * periodicTransform + (posRand.z * periodicTransformTrailing);

    float flowState = step(flowStateRange.x, transformTime) * (1. - step(flowStateRange.y, transformTime));
    float transitionState = step(transitionStateRange.x, transformTime) * (1. - step(transitionStateRange.y, transformTime));
    float imageState = step(imgStateRange.x, transformTime) * (1. - step(imgStateRange.y, transformTime));
    float transitionStateP = (transformTime - transitionStateRange.x) / (transitionStateRange.y - transitionStateRange.x);

    float radius = 200. + (50. * (posRand.x * posRand.y - 0.5));
    float spinTime = time / 100.;
    vec3 positionFlowCircular = vec3(
        sin(spinTime - posRand.z*6.28) * radius,
        cos(spinTime - posRand.z*6.28) * radius,
        0.0
    );
    vec3 positionFlowJitter = vec3(
        sin(time/(30. * posRand.x + 30.) + posRand.x * 20.)*(10. * posRand.x + 5.),
        cos(time/(30. * posRand.x + 30.) + posRand.x * 20.)*(10. * posRand.x + 5.),
        0.0
    );

    float band = floor(posRand.y * 3. + 0.5) + 1.;
    vec3 positionFlowWaves = vec3(
        sin(time/300. - band*posRand.z*5.*6.28) * 20.,
        cos(time/300. - band*posRand.z*5.*6.28) * 20.,
        0.0
    );

    vec3 positionFlow = positionFlowCircular + positionFlowWaves;

    vec3 positionImage = vec3(position.xy, 0.0);

    vec3 transitionPos = vec3(
        0.0 + 10.*posRand.x,
        200. + 10.*posRand.y,
        0.0
    );

    vec3 positionTransition = (
        clamp(1.0 - transitionStateP*2., 0.0, 1.0) * positionFlow
        + (1. - abs(transitionStateP*2. - 1.)) * transitionPos
        + clamp(transitionStateP*2. - 1., 0.0, 1.0) * positionImage
    );

    vec3 positionPeriodic = vec3(
        (transformTime*positionImage + (1. - transformTime)*positionFlow).xyz
    );

    
    vec3 postionFinal = (
        (flowState * positionFlow) + (transitionState * positionTransition) + (imageState * positionImage) + positionFlowJitter*(1.-periodicTransform)
    );

    vec4 modelViewPosition = modelViewMatrix * vec4(
        postionFinal.xyz,
        1.0
    );


    gl_PointSize = 10000. * (1. / - modelViewPosition.z );
    gl_Position = projectionMatrix * modelViewPosition;

    vCoordinates = imgCoord;

}
`;

export default vertex;
