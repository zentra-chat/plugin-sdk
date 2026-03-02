// Bridge SDK types — the interface plugins get when running inside a
// sandboxed iframe. This is framework-agnostic (no Svelte dependency).
// Plugins interact with Zentra through postMessage under the hood, but
// this SDK wraps all of that into a clean API.

/**
 * A subscribable value that works with any framework. Use subscribe() to
 * get notified of changes, or get() for a one-time read.
 */
export interface Subscribable<T> {
	get(): T;
	subscribe(fn: (value: T) => void): () => void;
}

export interface BridgeChannel {
	id: string;
	type: string;
}

export interface BridgeMessage {
	id: string;
	channelId: string;
	authorId: string;
	content?: string | null;
	author?: {
		id: string;
		username: string;
		displayName?: string | null;
		avatarUrl?: string | null;
	};
	attachments?: Array<{
		id: string;
		filename: string;
		url: string;
		thumbnailUrl?: string;
		contentType?: string | null;
	}>;
	createdAt: string;
}

export interface BridgeToast {
	type: 'success' | 'error' | 'warning' | 'info';
	message: string;
}

export interface BridgeChannelTypeDef {
	id: string;
	icon: string;
	label: string;
	description: string;
	showHash: boolean;
	headerActionIds?: string[];
}

export interface BridgeHeaderActionDef {
	id: string;
	title: string;
	icon: string;
	onClick: (context: { channelId: string; isPinnedOpen: boolean; isMemberSidebarOpen: boolean }) => void;
}

/**
 * The SDK object available as window.__zentra inside sandboxed plugin iframes.
 * All API calls go through a postMessage bridge that enforces permissions
 * on the host side — plugins can't bypass them.
 */
export interface ZentraBridgeSDK {
	/** Unique ID for this plugin */
	pluginId: string;
	/** Bitmask of permissions granted to this plugin */
	grantedPermissions: number;
	/** Resolves when the host has initialized the bridge */
	ready: Promise<void>;

	/** Proxied API — every method returns a Promise that goes through the bridge */
	api: {
		sendMessage(channelId: string, data: { content: string; attachments?: string[]; replyToId?: string }): Promise<BridgeMessage>;
		getMessages(channelId: string, options?: { limit?: number; before?: string; after?: string }): Promise<BridgeMessage[]>;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		[method: string]: (...args: any[]) => Promise<any>;
	};

	/** UI actions */
	ui: {
		addToast(toast: BridgeToast): Promise<void>;
		addMessage(channelId: string, message: BridgeMessage): Promise<void>;
	};

	/** Reactive stores — subscribe from any framework */
	stores: {
		activeChannel: Subscribable<BridgeChannel | null>;
		activeChannelMessages: Subscribable<BridgeMessage[]>;
		currentCommunityId: Subscribable<string | null>;
	};

	/** Register a custom channel type (shown in sidebar and channel creation) */
	registerChannelType(def: BridgeChannelTypeDef): void;
	/** Remove a previously registered channel type */
	unregisterChannelType(typeId: string): void;
	/** Register a header action button for channel views */
	registerHeaderAction(def: BridgeHeaderActionDef): void;
	/** Remove a previously registered header action */
	unregisterHeaderAction(actionId: string): void;
	/** Get the root DOM element to render your plugin UI into */
	getRootElement(): HTMLElement | null;
}

// Augment the global Window so TypeScript knows about __zentra
declare global {
	interface Window {
		__zentra?: ZentraBridgeSDK;
	}
}
