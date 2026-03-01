import type { Readable } from 'svelte/store';
import type { Component } from 'svelte';

export type IconComponent = Component | ((...args: unknown[]) => unknown) | unknown;

export interface ChannelHeaderActionContext {
	channelId: string;
	isPinnedOpen: boolean;
	isMemberSidebarOpen: boolean;
	togglePinnedDropdown: () => Promise<void>;
	toggleMemberSidebar: () => void;
}

export interface SDKCommunityMember {
	userId: string;
	roles?: Array<{ permissions?: number }>;
}

export interface SDKChannel {
	id: string;
	name: string;
	type: string;
	topic?: string | null;
	metadata?: Record<string, unknown>;
}

export interface SDKUser {
	id: string;
	username: string;
	displayName?: string | null;
	avatarUrl?: string | null;
}

export interface SDKAttachment {
	id: string;
	filename: string;
	url: string;
	thumbnailUrl?: string;
	contentType?: string | null;
}

export interface SDKMessage {
	id: string;
	channelId: string;
	authorId: string;
	content?: string | null;
	author?: SDKUser;
	attachments?: SDKAttachment[];
	createdAt: string;
}

export interface ZentraPluginSDK {
	registerChannelType: (def: {
		id: string;
		icon: IconComponent | string;
		viewComponent?: () => Promise<{ default: Component }>;
		viewElement?: {
			tagName: string;
			module: () => Promise<unknown>;
		};
		label: string;
		description: string;
		showHash: boolean;
		headerActionIds?: string[];
	}) => void;
	unregisterChannelType: (typeId: string) => void;
	registerHeaderAction: (def: {
		id: string;
		title: string;
		icon: IconComponent | string;
		onClick: (context: ChannelHeaderActionContext) => void | Promise<void>;
	}) => void;
	unregisterHeaderAction: (actionId: string) => void;
	getIcon: (name: string) => IconComponent | undefined;
	icons: Record<string, IconComponent>;
	api: {
		sendMessage: (channelId: string, data: { content: string; attachments?: string[]; replyToId?: string }) => Promise<SDKMessage>;
		uploadAttachment: (file: File, channelId: string) => Promise<SDKAttachment>;
		getMessages: (channelId: string, options?: { limit?: number; before?: string; after?: string }) => Promise<SDKMessage[]>;
		[k: string]: unknown;
	};
	stores: {
		activeChannel: Readable<SDKChannel | null>;
		activeCommunity: Readable<{ id: string; ownerId: string } | null>;
		activeCommunityMembers: Readable<SDKCommunityMember[]>;
		activeChannelMessages: Readable<SDKMessage[]>;
		currentUserId: Readable<string | null>;
	};
	permissions: {
		memberHasPermission: (member: SDKCommunityMember | null, permission: number) => boolean;
		Permission: Record<string, number>;
	};
	ui: {
		addToast: (toast: { type: 'success' | 'error' | 'warning' | 'info'; message: string }) => void;
		addMessage: (channelId: string, message: SDKMessage) => void;
	};
	components: {
		MessageList: () => Promise<{ default: Component }>;
		MessageInput: () => Promise<{ default: Component }>;
		MessageItem?: () => Promise<{ default: Component }>;
		Avatar: () => Promise<{ default: Component }>;
		Spinner: () => Promise<{ default: Component }>;
		Button: () => Promise<{ default: Component }>;
		Input: () => Promise<{ default: Component }>;
		Textarea: () => Promise<{ default: Component }>;
		VoiceChannelView?: () => Promise<{ default: Component }>;
	};
}

export type ZentraPluginRegister = (sdk: ZentraPluginSDK) => void | Promise<void>;

export function definePlugin(register: ZentraPluginRegister): ZentraPluginRegister {
	return register;
}
