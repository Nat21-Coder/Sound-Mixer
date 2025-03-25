import { Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { sounds } from "@/constants";
import { Sound } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Dispatch, RefObject, SetStateAction } from "react";
interface SoundGroupProps {
  volumes: any;
  setVolumes: Dispatch<SetStateAction<any>>;
  audioReady: boolean;
  audioError: string | null;
  setAudioError: Dispatch<SetStateAction<string | null>>;
  activeSound: Record<string, boolean>;
  setActiveSound: Dispatch<SetStateAction<Record<string, boolean>>>;
  audioContextRef: RefObject<AudioContext | null>;
  gainNodesRef: RefObject<Record<string, GainNode | null>>;
  isPlaying: boolean;
  groupName: "nature" | "noise" | "melody";
}
const SoundGroup = ({
  volumes,
  setVolumes,
  audioReady,
  audioError,
  setAudioError,
  activeSound,
  setActiveSound,
  audioContextRef,
  gainNodesRef,
  isPlaying,
  groupName,
}: SoundGroupProps) => {
  const { toast } = useToast();

  const handleVolumeChange = (
    type: "nature" | "noise" | "melody",
    value: number[]
  ) => {
    setVolumes((prev: any) => ({ ...prev, [type]: value[0] }));
  };
  const toggleSound = (sound: Sound) => {
    if (!audioContextRef?.current) return;

    try {
      const newActiveSound = {
        ...activeSound,
        [sound.name]: !activeSound[sound.name],
      };

      setActiveSound(newActiveSound);

      // Resume audio context if it's suspended (browser autoplay policy)
      if (audioContextRef?.current.state === "suspended") {
        audioContextRef?.current.resume().catch((e) => {
          console.error("Failed to resume audio context:", e);
          setAudioError("Failed to start audio playback");
          toast({
            title: "Error",
            description: "Failed to start audio playback",
            variant: "destructive",
          });
        });
      }

      const gainNode = gainNodesRef?.current?.[sound.name];
      if (gainNode) {
        if (newActiveSound[sound.name] && isPlaying) {
          gainNode.gain.value = (volumes[sound.type] / 100) * 0.5;
          toast({
            title: `${sound.name} activated`,
            description: `${sound.name} has been added to your mix`,
          });
        } else {
          gainNode.gain.value = 0;
          if (!newActiveSound[sound.name]) {
            toast({
              title: `${sound.name} deactivated`,
              description: `${sound.name} has been removed from your mix`,
            });
          }
        }
      }
    } catch (err) {
      console.error("Error toggling sound:", err);
      setAudioError(`Failed to toggle ${sound.name}`);
      toast({
        title: "Error",
        description: `Failed to toggle ${sound.name}`,
        variant: "destructive",
      });
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold capitalize">{groupName}</h2>
        <div className="flex items-center">
          {volumes?.[groupName] === 0 ? (
            <VolumeX className="h-5 w-5 text-gray-400" />
          ) : (
            <Volume2 className="h-5 w-5 text-primary" />
          )}
          <span className="ml-2 text-sm font-medium">
            {volumes?.[groupName]}%
          </span>
        </div>
      </div>

      <Slider
        value={[volumes?.[groupName]]}
        max={100}
        step={1}
        onValueChange={(value) => handleVolumeChange(groupName, value)}
        className="my-4"
        disabled={!audioReady || !!audioError}
      />

      <div className="flex flex-wrap gap-2">
        {sounds
          .filter((sound) => sound.type === groupName)
          .map((sound) => (
            <Button
              key={sound.name}
              variant={activeSound[sound.name] ? "default" : "outline"}
              className={`h-16 ${
                activeSound[sound.name] ? "dark:bg-white bg-gray-900" : ""
              }`}
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
  );
};

export default SoundGroup;
