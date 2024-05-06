export const UISoundPath = {
	"on": "audio/on.wav",
	"off": "audio/off.wav",
	"error": "audio/error.wav"
};

export const sides = ["top", "bottom", "left", "right"] as const;
export type Side = typeof sides[number];
