# @zentra/plugin-sdk

Standalone SDK for Zentra plugins.

This package gives plugin authors a stable interface to build plugins without
importing any frontend internal modules. Plugins only depend on this SDK and the
runtime object exposed by Zentra (`window.ZentraSDK`).

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
