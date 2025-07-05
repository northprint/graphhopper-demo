
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```bash
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const npm_package_scripts_test_e2e: string;
	export const npm_package_devDependencies_prettier: string;
	export const CLAUDE_CODE_ENTRYPOINT: string;
	export const TERM_PROGRAM: string;
	export const npm_package_devDependencies_eslint_plugin_svelte: string;
	export const NODE: string;
	export const ANDROID_HOME: string;
	export const ASDF_INSTALL_TYPE: string;
	export const npm_package_devDependencies_prettier_plugin_svelte: string;
	export const npm_package_devDependencies_typescript: string;
	export const INIT_CWD: string;
	export const ASDF_DIR: string;
	export const TERM: string;
	export const SHELL: string;
	export const npm_package_devDependencies_vite: string;
	export const TMPDIR: string;
	export const npm_package_scripts_lint: string;
	export const TERM_PROGRAM_VERSION: string;
	export const ANDROID_SDK_ROOT: string;
	export const npm_package_scripts_dev: string;
	export const MallocNanoZone: string;
	export const ORIGINAL_XDG_CURRENT_DESKTOP: string;
	export const ZDOTDIR: string;
	export const npm_package_private: string;
	export const npm_package_devDependencies__sveltejs_kit: string;
	export const npm_config_registry: string;
	export const ENABLE_IDE_INTEGRATION: string;
	export const PNPM_HOME: string;
	export const GIT_EDITOR: string;
	export const ASDF_INSTALL_PATH: string;
	export const NDK_HOME: string;
	export const USER: string;
	export const npm_package_scripts_check_watch: string;
	export const COMMAND_MODE: string;
	export const ASDF_INSTALL_VERSION: string;
	export const npm_package_devDependencies__sveltejs_adapter_static: string;
	export const PNPM_SCRIPT_SRC_DIR: string;
	export const npm_config_strict_peer_dependencies: string;
	export const SSH_AUTH_SOCK: string;
	export const CLAUDE_CODE_SSE_PORT: string;
	export const __CF_USER_TEXT_ENCODING: string;
	export const VSCODE_PROFILE_INITIALIZED: string;
	export const npm_package_devDependencies_eslint: string;
	export const npm_package_devDependencies__typescript_eslint_eslint_plugin: string;
	export const npm_package_devDependencies_tslib: string;
	export const npm_execpath: string;
	export const GOOGLE_CLOUD_PROJECT: string;
	export const npm_package_devDependencies_svelte: string;
	export const npm_config_frozen_lockfile: string;
	export const npm_package_devDependencies__typescript_eslint_parser: string;
	export const PATH: string;
	export const LaunchInstanceID: string;
	export const npm_package_dependencies_svelte_maplibre_gl: string;
	export const USER_ZDOTDIR: string;
	export const __CFBundleIdentifier: string;
	export const npm_config_auto_install_peers: string;
	export const PWD: string;
	export const npm_command: string;
	export const npm_package_scripts_preview: string;
	export const OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: string;
	export const npm_lifecycle_event: string;
	export const LANG: string;
	export const npm_package_name: string;
	export const npm_package_devDependencies__sveltejs_vite_plugin_svelte: string;
	export const npm_package_packageManager: string;
	export const NODE_PATH: string;
	export const npm_package_scripts_build: string;
	export const VSCODE_GIT_ASKPASS_EXTRA_ARGS: string;
	export const XPC_FLAGS: string;
	export const npm_package_devDependencies_vitest: string;
	export const npm_package_devDependencies_eslint_config_prettier: string;
	export const npm_config_node_gyp: string;
	export const XPC_SERVICE_NAME: string;
	export const npm_package_version: string;
	export const npm_package_devDependencies__sveltejs_adapter_auto: string;
	export const VSCODE_INJECTION: string;
	export const npm_package_devDependencies_svelte_check: string;
	export const HOME: string;
	export const SHLVL: string;
	export const npm_package_type: string;
	export const VSCODE_GIT_ASKPASS_MAIN: string;
	export const npm_package_scripts_test: string;
	export const LOGNAME: string;
	export const npm_package_scripts_format: string;
	export const npm_lifecycle_script: string;
	export const VSCODE_GIT_IPC_HANDLE: string;
	export const COREPACK_ENABLE_AUTO_PIN: string;
	export const npm_config__here_registry: string;
	export const npm_config_user_agent: string;
	export const VSCODE_GIT_ASKPASS_NODE: string;
	export const GIT_ASKPASS: string;
	export const npm_package_devDependencies__playwright_test: string;
	export const npm_package_devDependencies__types_eslint: string;
	export const CLAUDECODE: string;
	export const SECURITYSESSIONID: string;
	export const npm_package_scripts_clean: string;
	export const npm_package_dependencies_maplibre_gl: string;
	export const npm_package_scripts_check: string;
	export const COLORTERM: string;
	export const npm_package_scripts_test_unit: string;
	export const npm_node_execpath: string;
	export const NODE_ENV: string;
}

/**
 * Similar to [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
	export const PUBLIC_GRAPHHOPPER_URL: string;
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * This module cannot be imported into client-side code.
 * 
 * Dynamic environment variables cannot be used during prerendering.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		npm_package_scripts_test_e2e: string;
		npm_package_devDependencies_prettier: string;
		CLAUDE_CODE_ENTRYPOINT: string;
		TERM_PROGRAM: string;
		npm_package_devDependencies_eslint_plugin_svelte: string;
		NODE: string;
		ANDROID_HOME: string;
		ASDF_INSTALL_TYPE: string;
		npm_package_devDependencies_prettier_plugin_svelte: string;
		npm_package_devDependencies_typescript: string;
		INIT_CWD: string;
		ASDF_DIR: string;
		TERM: string;
		SHELL: string;
		npm_package_devDependencies_vite: string;
		TMPDIR: string;
		npm_package_scripts_lint: string;
		TERM_PROGRAM_VERSION: string;
		ANDROID_SDK_ROOT: string;
		npm_package_scripts_dev: string;
		MallocNanoZone: string;
		ORIGINAL_XDG_CURRENT_DESKTOP: string;
		ZDOTDIR: string;
		npm_package_private: string;
		npm_package_devDependencies__sveltejs_kit: string;
		npm_config_registry: string;
		ENABLE_IDE_INTEGRATION: string;
		PNPM_HOME: string;
		GIT_EDITOR: string;
		ASDF_INSTALL_PATH: string;
		NDK_HOME: string;
		USER: string;
		npm_package_scripts_check_watch: string;
		COMMAND_MODE: string;
		ASDF_INSTALL_VERSION: string;
		npm_package_devDependencies__sveltejs_adapter_static: string;
		PNPM_SCRIPT_SRC_DIR: string;
		npm_config_strict_peer_dependencies: string;
		SSH_AUTH_SOCK: string;
		CLAUDE_CODE_SSE_PORT: string;
		__CF_USER_TEXT_ENCODING: string;
		VSCODE_PROFILE_INITIALIZED: string;
		npm_package_devDependencies_eslint: string;
		npm_package_devDependencies__typescript_eslint_eslint_plugin: string;
		npm_package_devDependencies_tslib: string;
		npm_execpath: string;
		GOOGLE_CLOUD_PROJECT: string;
		npm_package_devDependencies_svelte: string;
		npm_config_frozen_lockfile: string;
		npm_package_devDependencies__typescript_eslint_parser: string;
		PATH: string;
		LaunchInstanceID: string;
		npm_package_dependencies_svelte_maplibre_gl: string;
		USER_ZDOTDIR: string;
		__CFBundleIdentifier: string;
		npm_config_auto_install_peers: string;
		PWD: string;
		npm_command: string;
		npm_package_scripts_preview: string;
		OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: string;
		npm_lifecycle_event: string;
		LANG: string;
		npm_package_name: string;
		npm_package_devDependencies__sveltejs_vite_plugin_svelte: string;
		npm_package_packageManager: string;
		NODE_PATH: string;
		npm_package_scripts_build: string;
		VSCODE_GIT_ASKPASS_EXTRA_ARGS: string;
		XPC_FLAGS: string;
		npm_package_devDependencies_vitest: string;
		npm_package_devDependencies_eslint_config_prettier: string;
		npm_config_node_gyp: string;
		XPC_SERVICE_NAME: string;
		npm_package_version: string;
		npm_package_devDependencies__sveltejs_adapter_auto: string;
		VSCODE_INJECTION: string;
		npm_package_devDependencies_svelte_check: string;
		HOME: string;
		SHLVL: string;
		npm_package_type: string;
		VSCODE_GIT_ASKPASS_MAIN: string;
		npm_package_scripts_test: string;
		LOGNAME: string;
		npm_package_scripts_format: string;
		npm_lifecycle_script: string;
		VSCODE_GIT_IPC_HANDLE: string;
		COREPACK_ENABLE_AUTO_PIN: string;
		npm_config__here_registry: string;
		npm_config_user_agent: string;
		VSCODE_GIT_ASKPASS_NODE: string;
		GIT_ASKPASS: string;
		npm_package_devDependencies__playwright_test: string;
		npm_package_devDependencies__types_eslint: string;
		CLAUDECODE: string;
		SECURITYSESSIONID: string;
		npm_package_scripts_clean: string;
		npm_package_dependencies_maplibre_gl: string;
		npm_package_scripts_check: string;
		COLORTERM: string;
		npm_package_scripts_test_unit: string;
		npm_node_execpath: string;
		NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * Dynamic environment variables cannot be used during prerendering.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		PUBLIC_GRAPHHOPPER_URL: string;
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
