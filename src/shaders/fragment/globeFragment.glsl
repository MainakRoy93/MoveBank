uniform sampler2D globeTexture;
varying vec2 vUV;

void main(){
    
    gl_FragColor = texture2D(globeTexture, vUV);
}