import type { ZentraPluginSDK, SDKCommunityMember, SDKMessage } from './index';

declare global {
	interface Window {
		ZentraSDK?: ZentraPluginSDK;
		ZentraPluginAPI?: ZentraPluginSDK;
	}
}

function readGlobalSDK(): ZentraPluginSDK | undefined {
	if (typeof window === 'undefined') return undefined;
	return window.ZentraSDK || window.ZentraPluginAPI;
}

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
