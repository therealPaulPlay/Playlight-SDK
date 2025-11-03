export const eventCallbacks = new Map();

export async function triggerEvent(event, ...args) {
	const callbacks = eventCallbacks.get(event);
	if (!callbacks) return;

	for (const callback of callbacks) {
		try {
			await callback(...args);
		} catch (error) {
			console.error(`Playlight ${event} callback error:`, error);
		}
	}
}
