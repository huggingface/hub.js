import { isFrontend } from "../../../shared";
import { hexFromBytes } from "./hexFromBytes";

const webWorkerCode = `
// Would prefer no CDN, but need a clever way to not burden the main file of the bundle
importScripts("https://cdn.jsdelivr.net/npm/hash-wasm@4/dist/sha256.umd.min.js");

const createSHA256 = hashwasm.createSHA256;

self.addEventListener('message', async (event) => {
	const { file } = event.data;
	const sha256 = await createSHA256();
	sha256.init();
	const reader = file.stream().getReader();
	const total = file.size;
	let bytesDone = 0;
	while (true) {
		const { done, value } = await reader.read();
		if (done) {
			break;
		}
		sha256.update(value);
		bytesDone += value.length;
		postMessage({ progress: bytesDone / total });
	}
	postMessage({ sha256: sha256.digest('hex') });
});
`;

/**
 * @returns hex-encoded sha
 */
export async function sha256(buffer: Blob, opts?: { useWebWorker?: boolean | { minSize: number } }): Promise<string> {
	const maxCryptoSize =
		typeof opts?.useWebWorker === "object" && opts?.useWebWorker.minSize !== undefined && isFrontend
			? opts.useWebWorker.minSize
			: 10_000_000;
	if (buffer.size < maxCryptoSize && globalThis.crypto?.subtle) {
		return hexFromBytes(
			new Uint8Array(
				await globalThis.crypto.subtle.digest("SHA-256", buffer instanceof Blob ? await buffer.arrayBuffer() : buffer)
			)
		);
	}

	if (isFrontend) {
		if (opts?.useWebWorker) {
			try {
				return new Promise((resolve, reject) => {
					// Todo: Maybe pool workers
					const worker = new Worker(URL.createObjectURL(new Blob([webWorkerCode])));
					worker.addEventListener("message", (event) => {
						if (event.data.sha256) {
							return resolve(event.data.sha256);
						}
						if (event.data.progress) {
							// console.log("Progress", event.data.progress);
							return;
						}
						reject(event);
					});
					worker.addEventListener("error", (event) => {
						reject(event.error);
					});
					worker.postMessage({ file: buffer });
				});
			} catch (err) {
				console.warn("Failed to use web worker for sha256", err);
			}
		}
		if (!wasmModule) {
			wasmModule = await import("hash-wasm");
		}

		const sha256 = await wasmModule.createSHA256();
		sha256.init();

		const reader = buffer.stream().getReader();

		while (true) {
			const { done, value } = await reader.read();

			if (done) {
				break;
			}

			sha256.update(value);
		}

		return sha256.digest("hex");
	}

	if (!cryptoModule) {
		cryptoModule = await import("./sha256-node");
	}

	return cryptoModule.sha256Node(buffer);
}

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let cryptoModule: typeof import("./sha256-node");
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let wasmModule: typeof import("hash-wasm");
