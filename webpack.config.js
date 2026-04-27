const webpack = require("@nativescript/webpack");
const { resolve } = require('path');

module.exports = (env) => {
	webpack.init(env);


	webpack.chainWebpack((config) => {
		config.resolve.alias.set('three/examples', resolve(__dirname, 'node_modules', 'three', 'examples'));
		config.resolve.alias.set('three/addons', resolve(__dirname, 'node_modules', 'three', 'examples', 'jsm'));
		config.resolve.alias.set('three/src', resolve(__dirname, 'node_modules', 'three', 'src'));
		// config.resolve.alias.set('three', resolve(__dirname, 'node_modules', 'three', 'build', 'three.webgpu.js'));
		// config.resolve.alias.set('three/tsl', resolve(__dirname, 'node_modules', 'three', 'build', 'three.tsl.js'));
	});

	webpack.Utils.addCopyRule('**/*.ogg');
	webpack.Utils.addCopyRule('**/*.glb');
	return webpack.resolveConfig();
};
