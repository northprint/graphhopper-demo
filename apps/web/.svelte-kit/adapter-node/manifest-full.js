export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {start:"_app/immutable/entry/start.BWexLZVg.js",app:"_app/immutable/entry/app.BDKjavvl.js",imports:["_app/immutable/entry/start.BWexLZVg.js","_app/immutable/chunks/BQrqvDIS.js","_app/immutable/chunks/Ds0SfzI0.js","_app/immutable/chunks/BT1s4pPb.js","_app/immutable/entry/app.BDKjavvl.js","_app/immutable/chunks/BT1s4pPb.js","_app/immutable/chunks/Ds0SfzI0.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/DhS3hQoo.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
