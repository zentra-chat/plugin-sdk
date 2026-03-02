import type { ZentraPluginSDK, SDKCommunityMember, SDKMessage } from './index';
import type { ZentraBridgeSDK } from './bridge';

declare global {
	interface Window {
		ZentraSDK?: ZentraPluginSDK;
		ZentraPluginAPI?: ZentraPluginSDK;
		__zentra?: ZentraBridgeSDK;
	}
}

function readGlobalSDK(): ZentraPluginSDK | undefined {
	if (typeof window === 'undefined') return undefined;
	return window.ZentraSDK || window.ZentraPluginAPI;
}

// Get the full SDK — only works for built-in plugins that run in the
// main thread alongside the Zentra app
export function getSDK(): ZentraPluginSDK {
	const sdk = readGlobalSDK();
	if (!sdk) {
		throw new Error('Zentra SDK is not available. Plugins must run inside the Zentra app runtime.');
	}
	return sdk;
}

export function hasSDK(): boolean {
	return Boolean(readGlobalSDK());
}

// Get the bridge SDK — the version available inside sandboxed iframes.
// This is what third-party plugins should use.
export function getBridgeSDK(): ZentraBridgeSDK {
	if (typeof window === 'undefined' || !window.__zentra) {
		throw new Error(
			'Zentra Bridge SDK not found. This function only works inside a sandboxed plugin iframe.'
		);
	}
	return window.__zentra;
}

// Check if we're running inside a sandboxed iframe
export function hasBridgeSDK(): boolean {
	return typeof window !== 'undefined' && Boolean(window.__zentra);
}

export function canMemberPostAnnouncements(member: SDKCommunityMember | null, ownerId: string | null, userId: string | null): boolean {
	if (!member || !userId) return false;
	if (ownerId && ownerId === userId) return true;
	const sdk = getSDK();
	const perms = sdk.permissions.Permission;
	return (
		sdk.permissions.memberHasPermission(member, perms.ManageChannels) ||
		sdk.permissions.memberHasPermission(member, perms.ManageMessages)
	);
}

export function countMessagesByPrefix(messages: SDKMessage[], prefix: string): number {
	return (messages || []).filter((msg) => (msg.content || '').startsWith(prefix)).length;
}
