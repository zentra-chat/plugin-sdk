#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { zipSync, strToU8 } from 'fflate';

function fail(message) {
	console.error(`[zentra-plugin] ${message}`);
	process.exit(1);
}

function detectPackageManager(projectDir) {
	if (existsSync(resolve(projectDir, 'pnpm-lock.yaml'))) return 'pnpm';
	if (existsSync(resolve(projectDir, 'yarn.lock'))) return 'yarn';
	if (existsSync(resolve(projectDir, 'bun.lockb'))) return 'bun';
	return 'npm';
}

function runBuild(projectDir) {
	const packageManager = detectPackageManager(projectDir);
	const command = packageManager;
	const args = packageManager === 'yarn' ? ['build'] : ['run', 'build'];
	const result = spawnSync(command, args, {
		cwd: projectDir,
		stdio: 'inherit',
		env: process.env
	});
	if (result.status !== 0) {
		fail('Build failed. Run the build command directly to inspect errors.');
	}
}

function walkFiles(dir, root, output) {
	const entries = readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		const absolute = resolve(dir, entry.name);
		if (entry.isDirectory()) {
			walkFiles(absolute, root, output);
			continue;
		}
		const rel = relative(root, absolute).split(sep).join('/');
		output.push({ absolute, relative: rel });
	}
}

function resolveEntryFile(distDir, manifest) {
	const fromManifest = typeof manifest.frontendBundle === 'string' ? manifest.frontendBundle.trim() : '';
	if (fromManifest && !fromManifest.startsWith('http://') && !fromManifest.startsWith('https://')) {
		const normalized = fromManifest.replace(/^\/+/, '');
		if (existsSync(resolve(distDir, '..', normalized))) {
			return normalized;
		}
	}

	const distFiles = [];
	walkFiles(distDir, distDir, distFiles);
	const jsFiles = distFiles
		.map((f) => f.relative)
		.filter((f) => f.endsWith('.js') && !f.includes('/'))
		.sort((a, b) => a.length - b.length);

	if (jsFiles.length === 0) {
		return null;
	}

	return `dist/${jsFiles[0]}`;
}

function parseArgs(argv) {
	const flags = {};
	for (let i = 0; i < argv.length; i += 1) {
		const value = argv[i];
		if (!value.startsWith('--')) continue;
		const key = value.slice(2);
		const next = argv[i + 1];
		if (!next || next.startsWith('--')) {
			flags[key] = true;
			continue;
		}
		flags[key] = next;
		i += 1;
	}
	return flags;
}

function packagePlugin(flags) {
	const projectDir = resolve(process.cwd(), String(flags.project || '.'));
	const manifestPath = resolve(projectDir, String(flags.manifest || 'src/manifest.json'));
	const distDir = resolve(projectDir, String(flags.dist || 'dist'));
	const outDir = resolve(projectDir, String(flags.outDir || 'build'));
	const skipBuild = Boolean(flags.skipBuild);

	if (!existsSync(manifestPath)) {
		fail(`Manifest was not found at ${manifestPath}`);
	}
	if (!skipBuild) {
		runBuild(projectDir);
	}
	if (!existsSync(distDir) || !statSync(distDir).isDirectory()) {
		fail(`Build output directory was not found at ${distDir}`);
	}

	const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
	if (!manifest.slug || !manifest.version) {
		fail('Manifest must include both slug and version.');
	}

	const entryFile = resolveEntryFile(distDir, manifest);
	if (!entryFile) {
		fail('Could not determine the frontend bundle entry file from dist output.');
	}

	const packagedManifest = {
		...manifest,
		frontendBundle: entryFile
	};

	const files = [];
	walkFiles(distDir, projectDir, files);

	const archiveFiles = {
		'manifest.json': strToU8(`${JSON.stringify(packagedManifest, null, 2)}\n`),
		'package-meta.json': strToU8(`${JSON.stringify({
			generatedAt: new Date().toISOString(),
			entryFile,
			slug: manifest.slug,
			version: manifest.version
		}, null, 2)}\n`)
	};

	for (const file of files) {
		archiveFiles[file.relative] = readFileSync(file.absolute);
	}

	mkdirSync(outDir, { recursive: true });
	const outputName = `${manifest.slug}-${manifest.version}.zplugin.zip`;
	const outputPath = resolve(outDir, outputName);
	const zipped = zipSync(archiveFiles, { level: 9 });
	writeFileSync(outputPath, Buffer.from(zipped));

	console.log(`[zentra-plugin] Packaged ${manifest.slug}@${manifest.version}`);
	console.log(`[zentra-plugin] Entry file: ${entryFile}`);
	console.log(`[zentra-plugin] Output: ${outputPath}`);
}

const [command, ...argv] = process.argv.slice(2);
if (!command || command === 'help' || command === '--help' || command === '-h') {
	console.log('Usage: zentra-plugin package [--project .] [--manifest src/manifest.json] [--dist dist] [--outDir build] [--skipBuild]');
	process.exit(0);
}

if (command !== 'package') {
	fail(`Unknown command "${command}".`);
}

const flags = parseArgs(argv);
packagePlugin(flags);
