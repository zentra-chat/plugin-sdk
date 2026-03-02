# @zentra/plugin-sdk

Standalone SDK for Zentra plugins.

This package gives plugin authors a stable interface to build plugins without
importing any frontend internal modules. Plugins only depend on this SDK and the
runtime object exposed by Zentra (`window.ZentraSDK` for built-in plugins, `window.__zentra` for sandboxed plugins).

## Exports

- `@zentra/plugin-sdk`
  - `definePlugin()` helper
  - `ZentraPluginSDK` types
- `@zentra/plugin-sdk/runtime`
  - `getSDK()` runtime accessor
  - `hasSDK()`
  - small utility helpers

## Packaging CLI

The SDK ships with a packaging command that handles multi-file plugin builds.

```bash
zentra-plugin package
```

What it does:

- runs your plugin build (`pnpm run build`, `yarn build`, or `npm run build`)
- reads `src/manifest.json`
- detects the frontend entry bundle from `dist`
- writes a single distributable archive to `build/<slug>-<version>.zplugin.zip`

Archive contents:

- `manifest.json` (with relative `frontendBundle`, e.g. `dist/my-plugin.js`)
- `package-meta.json` (entry metadata)
- full `dist/` output (all chunks/assets)

If `manifest.json` declares an icon file (for example `"icon": "assets/icon.svg"`),
the CLI includes that asset in the archive as well.

Manifest example:

```json
{
  "slug": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "Example plugin",
  "author": "you",
  "requestedPermissions": ["ReadMessages", "SendMessages", "AddChannelTypes"],
  "icon": "assets/icon.svg",
  "frontendBundle": "dist/my-plugin.js"
}
```

Optional flags:

```bash
zentra-plugin package --project . --manifest src/manifest.json --dist dist --outDir build --skipBuild
```

## Basic usage

```ts
import { definePlugin, type ZentraPluginSDK } from '@zentra/plugin-sdk';

export const register = definePlugin((sdk: ZentraPluginSDK) => {
  sdk.registerChannelType({
    id: 'my-type',
    icon: 'hash',
    viewComponent: () => import('./MyView.svelte'),
    label: 'My Type',
    description: 'My custom channel',
    showHash: true
  });
});
```
