"use client"

import { useState, useEffect, useRef } from "react"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { Volume2, VolumeX, Play, Pause, RefreshCw, Save, BookmarkPlus, Trash2, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { presetMixes, sounds } from "@/constants"
import { Sound, SoundMix } from "@/types"
import { Button } from "./ui/button"

export default function SoundMixer() {
  const { toast } = useToast()
  const [isPlaying, setIsPlaying] = useState(false)
  const [volumes, setVolumes] = useState({
    nature: 50,
    noise: 30,
    melody: 20,
  })
  const [activeSound, setActiveSound] = useState<Record<string, boolean>>({})
  const [audioReady, setAudioReady] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [savedMixes, setSavedMixes] = useState<SoundMix[]>([])
  const [newMixName, setNewMixName] = useState("")
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [loadDialogOpen, setLoadDialogOpen] = useState(false)

  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorsRef = useRef<Record<string, OscillatorNode | null>>({})
  const noiseSourcesRef = useRef<Record<string, AudioBufferSourceNode | null>>({})
  const gainNodesRef = useRef<Record<string, GainNode | null>>({})
  const filtersRef = useRef<Record<string, BiquadFilterNode | null>>({})

  // Load saved mixes from localStorage
  useEffect(() => {
    try {
      const savedMixesJson = localStorage.getItem("soundMixes")
      if (savedMixesJson) {
        const parsedMixes = JSON.parse(savedMixesJson)
        if (Array.isArray(parsedMixes)) {
          setSavedMixes(parsedMixes)
        }
      }
    } catch (err) {
      console.error("Error loading saved mixes:", err)
      toast({
        title: "Error",
        description: "Failed to load saved mixes"
      })
    }
  }, [toast])

  // Initialize Web Audio API
  useEffect(() => {
    try {
      // Create audio context
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContext) {
        throw new Error("Web Audio API not supported in this browser")
      }

      audioContextRef.current = new AudioContext()

      // Setup audio nodes for each sound
      sounds.forEach((sound) => {
        try {
          setupSound(sound)
        } catch (err) {
          console.error(`Error setting up audio for ${sound.name}:`, err)
        }
      })

      setAudioReady(true)
    } catch (err) {
      console.error("Audio initialization error:", err)
      setAudioError("Failed to initialize audio system")
      toast({
        title: "Error",
        description: "Failed to initialize audio system",
        variant:"destructive"
      })
    }

    return () => {
      // Cleanup audio nodes
      try {
        Object.values(oscillatorsRef.current).forEach((osc) => {
          if (osc) {
            try {
              osc.stop()
              osc.disconnect()
            } catch (e) {
              console.error("Error cleaning up oscillator:", e)
            }
          }
        })

        Object.values(noiseSourcesRef.current).forEach((source) => {
          if (source) {
            try {
              source.stop()
              source.disconnect()
            } catch (e) {
              console.error("Error cleaning up noise source:", e)
            }
          }
        })

        if (audioContextRef.current && audioContextRef.current.state !== "closed") {
          audioContextRef.current.close().catch((e) => console.error("Error closing audio context:", e))
        }
      } catch (err) {
        console.error("Error during audio cleanup:", err)
      }
    }
  }, [toast])

  const setupSound = (sound: Sound) => {
    if (!audioContextRef.current) return

    const ctx = audioContextRef.current

    // Create gain node for volume control
    const gainNode = ctx.createGain()
    gainNode.gain.value = 0 // Start muted
    gainNode.connect(ctx.destination)
    gainNodesRef.current[sound.name] = gainNode

    // Create different sound generators based on type
    if (sound.type === "noise") {
      createNoiseSound(sound.name, ctx, gainNode)
    } else if (sound.type === "melody") {
      createMelodySound(sound, ctx, gainNode)
    } else if (sound.type === "nature") {
      createNatureSound(sound, ctx, gainNode)
    }
  }

  const createNoiseSound = (type: string, ctx: AudioContext, gainNode: GainNode) => {
    try {
      // Create buffer for noise
      const bufferSize = 2 * ctx.sampleRate
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const output = noiseBuffer.getChannelData(0)

      // Fill buffer with noise
      for (let i = 0; i < bufferSize; i++) {
        if (type === "White Noise") {
          output[i] = Math.random() * 2 - 1
        } else if (type === "Pink Noise") {
          // Simple approximation of pink noise
          output[i] = (Math.random() * 2 - 1) * 0.5
        } else if (type === "Brown Noise") {
          // Simple approximation of brown noise
          output[i] = Math.random() * 0.1
        }
      }

      // Create audio source from buffer
      const noiseSource = ctx.createBufferSource()
      noiseSource.buffer = noiseBuffer
      noiseSource.loop = true

      // Apply filter based on noise type
      const filter = ctx.createBiquadFilter()

      if (type === "Pink Noise") {
        filter.type = "lowpass"
        filter.frequency.value = 2000
      } else if (type === "Brown Noise") {
        filter.type = "lowpass"
        filter.frequency.value = 500
      } else {
        filter.type = "highpass"
        filter.frequency.value = 100
      }

      noiseSource.connect(filter)
      filter.connect(gainNode)

      noiseSource.start()
      noiseSourcesRef.current[type] = noiseSource
      filtersRef.current[type] = filter
    } catch (err) {
      console.error("Error creating noise sound:", err)
      toast({
        title: "Error",
        description: `Failed to create ${type} sound`
      })
    }
  }

  const createMelodySound = (sound: Sound, ctx: AudioContext, gainNode: GainNode) => {
    try {
      // Create oscillator for melody
      const osc = ctx.createOscillator()

      // Set waveform and frequency
      osc.type = sound.waveType || "sine"
      osc.frequency.value = sound.frequency || 440

      osc.connect(gainNode)
      osc.start()

      oscillatorsRef.current[sound.name] = osc
    } catch (err) {
      console.error("Error creating melody sound:", err)
      toast({
        title: "Error",
        description: `Failed to create ${sound.name} sound`,
      })
    }
  }

  const createNatureSound = (sound: Sound, ctx: AudioContext, gainNode: GainNode) => {
    try {
      // Create a noise source as the base for nature sounds
      const bufferSize = 2 * ctx.sampleRate
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const output = noiseBuffer.getChannelData(0)

      // Fill buffer with noise
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1
      }

      const noiseSource = ctx.createBufferSource()
      noiseSource.buffer = noiseBuffer
      noiseSource.loop = true

      // Create filter to shape the noise into nature sounds
      const filter = ctx.createBiquadFilter()

      if (sound.name === "Rain") {
        filter.type = "bandpass"
        filter.frequency.value = sound.frequency || 1000
        filter.Q.value = 1
      } else if (sound.name === "Ocean") {
        filter.type = "lowpass"
        filter.frequency.value = sound.frequency || 400

        // Add a slow LFO for ocean waves if possible
        try {
          const lfo = ctx.createOscillator()
          lfo.frequency.value = 0.2
          const lfoGain = ctx.createGain()
          lfoGain.gain.value = 50

          lfo.connect(lfoGain)
          lfoGain.connect(filter.frequency)
          lfo.start()
        } catch (e) {
          console.warn("Could not create LFO for ocean waves:", e)
        }
      } else if (sound.name === "Forest") {
        filter.type = "bandpass"
        filter.frequency.value = sound.frequency || 800
        filter.Q.value = 0.5
      }

      noiseSource.connect(filter)
      filter.connect(gainNode)

      noiseSource.start()

      noiseSourcesRef.current[sound.name] = noiseSource
      filtersRef.current[sound.name] = filter
    } catch (err) {
      console.error("Error creating nature sound:", err)
      toast({
        title: "Error",
        description: `Failed to create ${sound.name} sound`,
      })
    }
  }

  // Update volumes when sliders change
  useEffect(() => {
    if (!audioContextRef.current) return

    sounds.forEach((sound) => {
      const gainNode = gainNodesRef.current[sound.name]
      if (gainNode && activeSound[sound.name]) {
        gainNode.gain.value = (volumes[sound.type] / 100) * 0.5 // Scale down a bit to avoid clipping
      }
    })
  }, [volumes, activeSound])

  const togglePlay = () => {
    if (!audioContextRef.current) return

    try {
      // Resume audio context if it's suspended (browser autoplay policy)
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume().catch((e) => {
          console.error("Failed to resume audio context:", e)
          setAudioError("Failed to start audio playback")
          toast({
            title: "Error",
            description: "Failed to start audio playback",
          })
        })
      }

      if (isPlaying) {
        // Mute all sounds
        Object.entries(gainNodesRef.current).forEach(([name, gain]) => {
          if (gain) {
            gain.gain.value = 0
          }
        })
        toast({
          title: "Playback paused",
          description: "All sounds have been muted",
        })
      } else {
        // Set volumes for active sounds
        Object.entries(activeSound).forEach(([name, isActive]) => {
          if (isActive) {
            const sound = sounds.find((s) => s.name === name)
            if (sound && gainNodesRef.current[name]) {
              gainNodesRef.current[name]!.gain.value = (volumes[sound.type] / 100) * 0.5
            }
          }
        })
        toast({
          title: "Playback started",
          description: "Your sound mix is now playing",
        })
      }

      setIsPlaying(!isPlaying)
    } catch (err) {
      console.error("Error toggling playback:", err)
      setAudioError("Failed to toggle playback")
      toast({
        title: "Error",
        description: "Failed to toggle playback"
      })
    }
  }

  const toggleSound = (sound: Sound) => {
    if (!audioContextRef.current) return

    try {
      const newActiveSound = {
        ...activeSound,
        [sound.name]: !activeSound[sound.name],
      }

      setActiveSound(newActiveSound)

      // Resume audio context if it's suspended (browser autoplay policy)
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume().catch((e) => {
          console.error("Failed to resume audio context:", e)
          setAudioError("Failed to start audio playback")
          toast({
            title: "Error",
            description: "Failed to start audio playback"
          })
        })
      }

      const gainNode = gainNodesRef.current[sound.name]
      if (gainNode) {
        if (newActiveSound[sound.name] && isPlaying) {
          gainNode.gain.value = (volumes[sound.type] / 100) * 0.5
          toast({
            title: `${sound.name} activated`,
            description: `${sound.name} has been added to your mix`,
          })
        } else {
          gainNode.gain.value = 0
          if (!newActiveSound[sound.name]) {
            toast({
              title: `${sound.name} deactivated`,
              description: `${sound.name} has been removed from your mix`,
            })
          }
        }
      }
    } catch (err) {
      console.error("Error toggling sound:", err)
      setAudioError(`Failed to toggle ${sound.name}`)
      toast({
        title: "Error",
        description: `Failed to toggle ${sound.name}`,
      })
    }
  }

  const resetMixer = () => {
    try {
      // Mute all sounds
      Object.values(gainNodesRef.current).forEach((gain) => {
        if (gain) {
          gain.gain.value = 0
        }
      })

      setIsPlaying(false)
      setVolumes({ nature: 50, noise: 30, melody: 20 })
      setActiveSound({})
      toast({
        title: "Mixer reset",
        description: "All settings have been reset to default",
      })
    } catch (err) {
      console.error("Error resetting mixer:", err)
      setAudioError("Failed to reset mixer")
      toast({
        title: "Error",
        description: "Failed to reset mixer",
      })
    }
  }

  const handleVolumeChange = (type: "nature" | "noise" | "melody", value: number[]) => {
    setVolumes((prev) => ({ ...prev, [type]: value[0] }))
  }

  // Save current mix
  const saveMix = () => {
    if (!newMixName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your mix",
        variant:"destructive"
      })
      return
    }

    // Check if any sounds are active
    const hasActiveSounds = Object.values(activeSound).some((isActive) => isActive)
    if (!hasActiveSounds) {
      toast({
        title: "Error",
        description: "Please select at least one sound before saving"
      })
      return
    }

    try {
      const newMix: SoundMix = {
        id: `mix-${Date.now()}`,
        name: newMixName.trim(),
        activeSound: { ...activeSound },
        volumes: { ...volumes },
        createdAt: Date.now(),
      }

      const updatedMixes = [...savedMixes, newMix]
      setSavedMixes(updatedMixes)

      // Save to localStorage
      localStorage.setItem("soundMixes", JSON.stringify(updatedMixes))

      // Reset form and close dialog
      setNewMixName("")
      setSaveDialogOpen(false)
      toast({
        title: "Mix saved",
        description: `"${newMixName.trim()}" has been saved successfully`,
      })
    } catch (err) {
      console.error("Error saving mix:", err)
      toast({
        title: "Error",
        description: "Failed to save mix"
      })
    }
  }

  // Load a saved mix
  const loadMix = (mix: SoundMix) => {
    try {
      // Stop all current sounds
      if (isPlaying) {
        Object.values(gainNodesRef.current).forEach((gain) => {
          if (gain) {
            gain.gain.value = 0
          }
        })
        setIsPlaying(false)
      }

      // Apply the mix settings
      setVolumes({ ...mix.volumes })
      setActiveSound({ ...mix.activeSound })

      // Close the dialog
      setLoadDialogOpen(false)
      toast({
        title: "Mix loaded",
        description: `"${mix.name}" has been loaded successfully`,
      })
    } catch (err) {
      console.error("Error loading mix:", err)
      setAudioError("Failed to load mix")
      toast({
        title: "Error",
        description: "Failed to load mix"
      })
    }
  }

  // Delete a saved mix
  const deleteMix = (mixId: string) => {
    try {
      const mixToDelete = savedMixes.find((mix) => mix.id === mixId)
      const updatedMixes = savedMixes.filter((mix) => mix.id !== mixId)
      setSavedMixes(updatedMixes)

      // Update localStorage
      localStorage.setItem("soundMixes", JSON.stringify(updatedMixes))

      if (mixToDelete) {
        toast({
          title: "Mix deleted",
          description: `"${mixToDelete.name}" has been deleted`,
        })
      }
    } catch (err) {
      console.error("Error deleting mix:", err)
      toast({
        title: "Error",
        description: "Failed to delete mix",
      })
    }
  }

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8">
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="flex flex-col space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">Focus Sound Mixer</h1>
              <p className="text-gray-500">Blend sounds to create your perfect focus environment</p>

              {audioError && <div className="mt-2 p-2 bg-red-100 text-red-700 rounded-md">{audioError}</div>}

              {!audioReady && !audioError && (
                <div className="mt-2 p-2 bg-blue-100 text-blue-700 rounded-md">Initializing audio system...</div>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-2 md:gap-4">
              <Button
                onClick={togglePlay}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white"
                disabled={!audioReady || !!audioError}
              >
                {isPlaying ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
                {isPlaying ? "Pause" : "Play"}
              </Button>

              <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="lg" disabled={!audioReady || !!audioError}>
                    <Save className="mr-2 h-5 w-5" />
                    Save Mix
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Current Mix</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <Input
                      placeholder="Enter a name for your mix"
                      value={newMixName}
                      onChange={(e) => setNewMixName(e.target.value)}
                      className="mb-4"
                    />
                    <div className="text-sm text-gray-500">
                      This will save your current sound selection and volume settings.
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={saveMix}>Save Mix</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="lg" disabled={!audioReady || !!audioError}>
                    <BookmarkPlus className="mr-2 h-5 w-5" />
                    Load Mix
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Load Sound Mix</DialogTitle>
                  </DialogHeader>
                  <Tabs defaultValue="saved">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="saved">Your Mixes</TabsTrigger>
                      <TabsTrigger value="presets">Presets</TabsTrigger>
                    </TabsList>
                    <TabsContent value="saved" className="mt-4">
                      {savedMixes.length > 0 ? (
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-2">
                            {savedMixes.map((mix) => (
                              <div
                                key={mix.id}
                                className="flex items-center justify-between p-3 rounded-md border hover:bg-gray-50"
                              >
                                <div>
                                  <h3 className="font-medium">{mix.name}</h3>
                                  <p className="text-xs text-gray-500">{formatDate(mix.createdAt)}</p>
                                </div>
                                <div className="flex gap-2">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => loadMix(mix)}>
                                          <Check className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Load this mix</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>

                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => deleteMix(mix.id)}>
                                          <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Delete this mix</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>You haven't saved any mixes yet.</p>
                          <p className="text-sm mt-2">Create your perfect sound blend and save it for later!</p>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="presets" className="mt-4">
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-2">
                          {presetMixes.map((mix) => (
                            <div
                              key={mix.id}
                              className="flex items-center justify-between p-3 rounded-md border hover:bg-gray-50"
                            >
                              <div>
                                <h3 className="font-medium">{mix.name}</h3>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {Object.entries(mix.activeSound)
                                    .filter(([_, isActive]) => isActive)
                                    .map(([name]) => {
                                      const sound = sounds.find((s) => s.name === name)
                                      return sound ? (
                                        <span key={name} className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100">
                                          <span className="mr-1">{sound.icon}</span> {name}
                                        </span>
                                      ) : null
                                    })}
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => loadMix(mix)}>
                                Load
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>

              <Button onClick={resetMixer} variant="outline" size="lg" disabled={!audioReady || !!audioError}>
                <RefreshCw className="mr-2 h-5 w-5" />
                Reset
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Nature Sounds */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Nature</h2>
                  <div className="flex items-center">
                    {volumes.nature === 0 ? (
                      <VolumeX className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Volume2 className="h-5 w-5 text-primary" />
                    )}
                    <span className="ml-2 text-sm font-medium">{volumes.nature}%</span>
                  </div>
                </div>

                <Slider
                  value={[volumes.nature]}
                  max={100}
                  step={1}
                  onValueChange={(value) => handleVolumeChange("nature", value)}
                  className="my-4"
                  disabled={!audioReady || !!audioError}
                />

                <div className="grid grid-cols-3 gap-2">
                  {sounds
                    .filter((sound) => sound.type === "nature")
                    .map((sound) => (
                      <Button
                        key={sound.name}
                        variant={activeSound[sound.name] ? "default" : "outline"}
                        className={`h-16 ${activeSound[sound.name] ? "bg-gray-900" : ""}`}
                        onClick={() => toggleSound(sound)}
                        disabled={!audioReady || !!audioError}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-xl">{sound.icon}</span>
                          <span className="text-xs mt-1">{sound.name}</span>
                        </div>
                      </Button>
                    ))}
                </div>
              </div>

              {/* White Noise */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Noise</h2>
                  <div className="flex items-center">
                    {volumes.noise === 0 ? (
                      <VolumeX className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Volume2 className="h-5 w-5 text-primary" />
                    )}
                    <span className="ml-2 text-sm font-medium">{volumes.noise}%</span>
                  </div>
                </div>

                <Slider
                  value={[volumes.noise]}
                  max={100}
                  step={1}
                  onValueChange={(value) => handleVolumeChange("noise", value)}
                  className="my-4"
                  disabled={!audioReady || !!audioError}
                />

                <div className="grid grid-cols-3 gap-2">
                  {sounds
                    .filter((sound) => sound.type === "noise")
                    .map((sound) => (
                      <Button
                        key={sound.name}
                        variant={activeSound[sound.name] ? "default" : "outline"}
                        className={`h-16 ${activeSound[sound.name] ? "bg-gray-900" : ""}`}
                        onClick={() => toggleSound(sound)}
                        disabled={!audioReady || !!audioError}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-xl">{sound.icon}</span>
                          <span className="text-xs mt-1">{sound.name}</span>
                        </div>
                      </Button>
                    ))}
                </div>
              </div>

              {/* Melody */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Melody</h2>
                  <div className="flex items-center">
                    {volumes.melody === 0 ? (
                      <VolumeX className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Volume2 className="h-5 w-5 text-primary" />
                    )}
                    <span className="ml-2 text-sm font-medium">{volumes.melody}%</span>
                  </div>
                </div>

                <Slider
                  value={[volumes.melody]}
                  max={100}
                  step={1}
                  onValueChange={(value) => handleVolumeChange("melody", value)}
                  className="my-4"
                  disabled={!audioReady || !!audioError}
                />

                <div className="grid grid-cols-3 gap-2">
                  {sounds
                    .filter((sound) => sound.type === "melody")
                    .map((sound) => (
                      <Button
                        key={sound.name}
                        variant={activeSound[sound.name] ? "default" : "outline"}
                        className={`h-16 ${activeSound[sound.name] ? "bg-gray-900" : ""}`}
                        onClick={() => toggleSound(sound)}
                        disabled={!audioReady || !!audioError}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-xl">{sound.icon}</span>
                          <span className="text-xs mt-1">{sound.name}</span>
                        </div>
                      </Button>
                    ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Currently Playing:</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(activeSound)
                  .filter(([_, isActive]) => isActive)
                  .map(([name]) => {
                    const sound = sounds.find((s) => s.name === name)
                    return sound ? (
                      <span
                        key={name}
                        className={`bg-gray-900 text-white px-3 py-1 rounded-full text-sm flex items-center`}
                      >
                        <span className="mr-1">{sound.icon}</span> {name}
                      </span>
                    ) : null
                  })}
                {Object.values(activeSound).filter(Boolean).length === 0 && (
                  <span className="text-gray-500 italic">No sounds selected</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Toaster />
    </div>
  )
}

