// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}
}

declare module 'node:fs/promises' {
	export function readFile(path: string, encoding: string): Promise<string>;
	export function writeFile(path: string, data: string, encoding?: string): Promise<void>;
}

declare module 'node:crypto' {
	interface Hash {
		update(data: string): Hash;
		digest(encoding: 'hex'): string;
	}

	export function createHash(algorithm: string): Hash;
}

export {};
