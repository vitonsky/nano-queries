/* eslint-disable spellcheck/spell-checker */
import { dest, parallel, series, src } from 'gulp';
import cleanPackageJson from 'gulp-clean-package';
import sourcemaps from 'gulp-sourcemaps';
import ts from 'gulp-typescript';
import mergeStream from 'merge-stream';

const buildDir = 'dist';

// Helpers
function tsCompilerFactory(outPath, settings) {
	return function compileTS() {
		const tsProject = ts.createProject('tsconfig.json', settings);

		return src(['src/**/!(*.test).{ts,tsx}'])
			.pipe(sourcemaps.init())
			.pipe(tsProject())
			.pipe(sourcemaps.write())
			.pipe(dest(outPath));
	};
}

// Main
function build() {
	return parallel([
		// Compile TS files
		Object.assign(tsCompilerFactory(buildDir, { module: 'commonjs' }), {
			displayName: 'TSC:esnext',
		}),

		// Copy js files and declarations
		Object.assign(
			function copyNotTranspilableSources() {
				return src([`src/**/!(*.test).{js,d.ts}`]).pipe(dest(buildDir));
			},
			{
				displayName: 'CopyPureSources:esnext',
			},
		),
	]);
}

function copyMetaFiles() {
	return mergeStream(
		// Clean package.json
		src(['package.json']).pipe(cleanPackageJson()),
		// Copy other
		src(['README.md', 'LICENSE']),
	).pipe(dest(buildDir));
}

// Compilations
const fullBuild = series([copyMetaFiles, build()]);

const _default = fullBuild;
export { _default as default };
