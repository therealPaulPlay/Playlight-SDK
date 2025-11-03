export function playSound(path, volume = 1) {
	try {
		const sound = new Audio(path);
		sound.volume = volume;
		sound.play();
	} catch (error) {
		console.error("Error playing sound:", error);
	}
}
