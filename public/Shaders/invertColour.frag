varying vec2 vTextureCoord;
uniform sampler2D uSampler;

void main(void) {
	vec4 currentColor = texture2D(uSampler, vTextureCoord);
	gl_FragColor.rgba = currentColor.brga;
}