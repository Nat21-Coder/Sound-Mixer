"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, RefreshCw } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sound, SoundMix } from "@/types";
import { soundGroups, sounds } from "@/constants";
import SoundGroup from "@/components/sound-group";
import LoadMixDialog from "@/components/load-mix-dialog";
import SaveMixDialog from "@/components/save-mix-dialog";
import LoaderSpinner from "@/components/loader-spinner";
import DisplayCurrentPlayingSounds from "@/components/display-current-playing-sounds";
import { toast } from "sonner";

export default function SoundMixer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volumes, setVolumes] = useState({
    nature: 50,
    noise: 30,
    melody: 20,
  });
  const [activeSound, setActiveSound] = useState<Record<string, boolean>>({});
  const [audioReady, setAudioReady] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [savedMixes, setSavedMixes] = useState<SoundMix[]>([]);
  const [newMixName, setNewMixName] = useState<string>("");
  const [saveDialogOpen, setSaveDialogOpen] = useState<boolean>(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState<boolean>(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<Record<string, OscillatorNode | null>>({});
  const noiseSourcesRef = useRef<Record<string, AudioBufferSourceNode | null>>(
    {}
  );
  const gainNodesRef = useRef<Record<string, GainNode | null>>({});

  // Load saved mixes from localStorage
  useEffect(() => {
    try {
      const savedMixesJson = localStorage.getItem("soundMixes");
      if (savedMixesJson) {
        const parsedMixes = JSON.parse(savedMixesJson);
        if (Array.isArray(parsedMixes)) {
          setSavedMixes(parsedMixes);
        }
      }
    } catch (err) {
      console.error("Error loading saved mixes:", err);
      toast( "Failed to load saved mixes");
    }
  }, [toast]);

  useEffect(() => {
    try {
      // Create audio context
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        throw new Error("Web Audio API not supported in this browser");
      }

      audioContextRef.current = new AudioContext();

      // Setup audio nodes for each sound
      sounds.forEach((sound) => {
        try {
          setupSound(sound);
        } catch (err) {
          console.error(`Error setting up audio for ${sound.name}:`, err);
        }
      });

      setAudioReady(true);
    } catch (err) {
      console.error("Audio initialization error:", err);
      setAudioError("Failed to initialize audio system");
      toast("Failed to initialize audio system");
    }

    return () => {
      // Cleanup audio nodes
      try {
        Object.values(oscillatorsRef.current).forEach((osc) => {
          if (osc) {
            try {
              osc.stop();
              osc.disconnect();
            } catch (e) {
              console.error("Error cleaning up oscillator:", e);
            }
          }
        });

        Object.values(noiseSourcesRef.current).forEach((source) => {
          if (source) {
            try {
              source.stop();
              source.disconnect();
            } catch (e) {
              console.error("Error cleaning up noise source:", e);
            }
          }
        });

        if (
          audioContextRef.current &&
          audioContextRef.current.state !== "closed"
        ) {
          audioContextRef.current
            .close()
            .catch((e) => console.error("Error closing audio context:", e));
        }
      } catch (err) {
        console.error("Error during audio cleanup:", err);
      }
    };
  }, [toast]);

  const setupSound = (sound: Sound) => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;

    // Create gain node for volume control
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0; // Start muted
    gainNode.connect(ctx.destination);
    gainNodesRef.current[sound.name] = gainNode;

    // Create different sound generators based on type
    if (sound.type === "noise") {
      createNoiseSound(sound, ctx, gainNode);
    } else if (sound.type === "melody") {
      createMelodySound(sound, ctx, gainNode);
    } else if (sound.type === "nature") {
      createNatureSound(sound, ctx, gainNode);
    }
  };

  const createNoiseSound = async (
    sound: Sound,
    ctx: AudioContext,
    gainNode: GainNode
  ) => {
    try {
      const response = await fetch(`/sounds/${sound.name.toLowerCase()}.wav`);
      if (!response.ok) throw new Error("Failed to fetch sound file");
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true;
      source.connect(gainNode);
      source.start();
      noiseSourcesRef.current[sound.name] = source;
    } catch (err) {
      console.error("Error creating noise sound:", err);
      toast( `Failed to create ${sound.name} sound`);
    }
  };

  const createMelodySound = async (
    sound: Sound,
    ctx: AudioContext,
    gainNode: GainNode
  ) => {
    try {
      let response;
      if (sound.name === "Lo-Fi") {
        response = await fetch(`/sounds/${sound.name.toLowerCase()}.flac`);
      } else {
        response = await fetch(`/sounds/${sound.name.toLowerCase()}.wav`);
      }
      if (!response || !response?.ok)
        throw new Error("Failed to fetch sound file");
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true;
      source.connect(gainNode);
      source.start();
      noiseSourcesRef.current[sound.name] = source;
    } catch (err) {
      console.error("Error creating melody sound:", err);
      toast(`Failed to create ${sound.name} sound`);
    }
  };

  const createNatureSound = async (
    sound: Sound,
    ctx: AudioContext,
    gainNode: GainNode
  ) => {
    try {
      let response;
      if (sound.name === "Ocean") {
        response = await fetch(`/sounds/${sound.name.toLowerCase()}.flac`);
      } else {
        response = await fetch(`/sounds/${sound.name.toLowerCase()}.wav`);
      }
      if (!response || !response?.ok)
        throw new Error("Failed to fetch sound file");
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true;
      source.connect(gainNode);
      source.start();
      noiseSourcesRef.current[sound.name] = source;
    } catch (err) {
      console.error("Error loading nature sound:", err);
      toast(`Failed to load ${sound.name} sound`);
    }
  };

  useEffect(() => {
    if (!audioContextRef.current || !isPlaying) return;
    let gainNodeExists = false;
    sounds.forEach((sound) => {
      const gainNode = gainNodesRef.current[sound.name];
      if (gainNode) {
        if (activeSound[sound.name]) {
          gainNode.gain.value = (volumes[sound.type] / 100) * 0.5;
        }
        gainNodeExists = true;
      }
    });
    if (!gainNodeExists) {
      Object.values(gainNodesRef.current).forEach((gain) => {
        if (gain) {
          gain.gain.value = 0;
        }
      });

      setIsPlaying(false);
      toast("No Playing Sound.");
    }
  }, [volumes, activeSound, isPlaying]);

  const startPlayback = async () => {
    if (!audioContextRef.current) return;

    try {
      // Resume audio context if it's suspended
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current?.resume();
      }

      // Set volumes for active sounds and mute inactive sounds
      let activeSoundExist = false;
      sounds.forEach((sound) => {
        const gainNode = gainNodesRef.current[sound.name];
        if (gainNode) {
          if (activeSound[sound.name]) {
            gainNode.gain.value = (volumes[sound.type] / 100) * 0.5;
            activeSoundExist=true;
          } else {
            gainNode.gain.value = 0;
          }
        }
      });
      if(activeSoundExist){
        setIsPlaying(true);
        toast( "Your sound mix is now playing");

      }
    } catch (err) {
      console.error("Error starting playback:", err);
      setAudioError("Failed to start playback");
      toast( "Failed to start playback");
    }
  };

  const stopPlayback = () => {
    if (!audioContextRef.current) return;

    try {
      // Mute all sounds
      Object.values(gainNodesRef.current).forEach((gain) => {
        if (gain) {
          gain.gain.value = 0;
        }
      });

      setIsPlaying(false);
      toast("All sounds have been muted");
    } catch (err) {
      console.error("Error stopping playback:", err);
      setAudioError("Failed to stop playback");
      toast("Failed to stop playback");
    }
  };

  const resetMixer = () => {
    try {
      // Mute all sounds
      Object.values(gainNodesRef.current).forEach((gain) => {
        if (gain) {
          gain.gain.value = 0;
        }
      });

      setIsPlaying(false);
      setVolumes({ nature: 50, noise: 30, melody: 20 });
      setActiveSound({});
      toast( "All settings have been reset to default");
    } catch (err) {
      console.error("Error resetting mixer:", err);
      setAudioError("Failed to reset mixer");
      toast( "Failed to reset mixer");
    }
  };

  // Show loading spinner when audio is initializing
  if (!audioReady && !audioError) {
    return <LoaderSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8 transition-colors duration-200">
      <Card className="max-w-4xl mx-auto bg-white dark:bg-gray-950 border dark:border-gray-800">
        <CardContent className="p-6">
          <div className="flex flex-col space-y-8">
            <div className="text-center">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10" /> {/* Empty div for balance */}
                <h1 className="text-3xl font-bold">Focus Sound Mixer</h1>
                <ThemeToggle />
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                Blend sounds to create your perfect focus environment
              </p>

              {audioError && (
                <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md">
                  {audioError}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4  gap-2 sm:gap-4">
              <Button
                onClick={isPlaying ? stopPlayback : startPlayback}
                className="flex gap-2"
                disabled={!audioReady || !!audioError}
              >
                {isPlaying ? (
                  <Pause className="hidden sm:block h-5 w-5" />
                ) : (
                  <Play className="hidden sm:block h-5 w-5" />
                )}
                {isPlaying ? "Pause" : "Play"}
              </Button>

              {/* SAVE MIX */}
              <SaveMixDialog
                saveDialogOpen={saveDialogOpen}
                setSaveDialogOpen={setSaveDialogOpen}
                audioReady={audioReady}
                audioError={audioError}
                newMixName={newMixName}
                activeSound={activeSound}
                volumes={volumes}
                savedMixes={savedMixes}
                setSavedMixes={setSavedMixes}
                setNewMixName={setNewMixName}
              />

              {/* LOAD MIX */}
              <LoadMixDialog
                setVolumes={setVolumes}
                setActiveSound={setActiveSound}
                loadDialogOpen={loadDialogOpen}
                setLoadDialogOpen={setLoadDialogOpen}
                audioReady={audioReady}
                audioError={audioError}
                savedMixes={savedMixes}
                setSavedMixes={setSavedMixes}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                gainNodesRef={gainNodesRef}
                setAudioError={setAudioError}
              />

              <Button
                onClick={resetMixer}
                variant="outline"
                className="flex gap-2"
                disabled={!audioReady || !!audioError}
              >
                <RefreshCw className="hidden sm:block h-5 w-5" />
                Reset
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {soundGroups.map((group) => (
                <SoundGroup
                  key={group}
                  volumes={volumes}
                  setVolumes={setVolumes}
                  audioReady={audioReady}
                  audioError={audioError}
                  setAudioError={setAudioError}
                  activeSound={activeSound}
                  setActiveSound={setActiveSound}
                  audioContextRef={audioContextRef}
                  gainNodesRef={gainNodesRef}
                  isPlaying={isPlaying}
                  groupName={group}
                />
              ))}
            </div>

            <DisplayCurrentPlayingSounds activeSound={activeSound} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
