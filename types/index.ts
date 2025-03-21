export interface Sound {
  name: string
  type: "nature" | "noise" | "melody"
  icon: string
  color: string
  frequency?: number
  waveType?: OscillatorType
}

export interface SoundMix {
  id: string
  name: string
  activeSound: Record<string, boolean>
  volumes: {
    nature: number
    noise: number
    melody: number
  }
  createdAt: number
}
