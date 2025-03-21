import { Sound, SoundMix } from "@/types"

export const sounds: Sound[] = [
  {
    name: "Rain",
    type: "nature",
    icon: "🌧️",
    color: "bg-blue-500",
    frequency: 1000, // Higher frequency for rain
  },
  {
    name: "Forest",
    type: "nature",
    icon: "🌲",
    color: "bg-green-600",
    frequency: 800, // Medium frequency for forest
  },
  {
    name: "Ocean",
    type: "nature",
    icon: "🌊",
    color: "bg-blue-400",
    frequency: 400, // Low frequency for ocean
  },
  {
    name: "White Noise",
    type: "noise",
    icon: "⚪",
    color: "bg-gray-300",
  },
  {
    name: "Pink Noise",
    type: "noise",
    icon: "🔘",
    color: "bg-pink-300",
  },
  {
    name: "Brown Noise",
    type: "noise",
    icon: "🟤",
    color: "bg-amber-700",
  },
  {
    name: "Piano",
    type: "melody",
    icon: "🎹",
    color: "bg-indigo-500",
    frequency: 440, // A4
    waveType: "sine",
  },
  {
    name: "Ambient",
    type: "melody",
    icon: "🎵",
    color: "bg-purple-500",
    frequency: 220, // A3
    waveType: "sine",
  },
  {
    name: "Lo-Fi",
    type: "melody",
    icon: "🎧",
    color: "bg-teal-500",
    frequency: 330, // E4
    waveType: "triangle",
  },
]

// Preset mixes
export const presetMixes: SoundMix[] = [
  {
    id: "preset-1",
    name: "Deep Focus",
    activeSound: {
      "Brown Noise": true,
      Piano: true,
    },
    volumes: {
      nature: 0,
      noise: 70,
      melody: 30,
    },
    createdAt: Date.now(),
  },
  {
    id: "preset-2",
    name: "Nature Retreat",
    activeSound: {
      Forest: true,
      Rain: true,
    },
    volumes: {
      nature: 80,
      noise: 0,
      melody: 0,
    },
    createdAt: Date.now(),
  },
  {
    id: "preset-3",
    name: "Relaxation",
    activeSound: {
      Ocean: true,
      Ambient: true,
    },
    volumes: {
      nature: 60,
      noise: 0,
      melody: 40,
    },
    createdAt: Date.now(),
  },
  {
    id: "preset-4",
    name: "Productivity",
    activeSound: {
      "White Noise": true,
      "Lo-Fi": true,
    },
    volumes: {
      nature: 0,
      noise: 50,
      melody: 50,
    },
    createdAt: Date.now(),
  },
]