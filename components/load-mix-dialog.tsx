import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookmarkPlus, Check, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { presetMixes, sounds } from "@/constants";
import { SoundMix } from "@/types";
import { Dispatch, RefObject, SetStateAction } from "react";
import { toast } from "sonner";
interface LoadMixDialogProps {
  setVolumes: Dispatch<SetStateAction<any>>;
  setActiveSound: Dispatch<SetStateAction<Record<string, boolean>>>;
  loadDialogOpen: boolean;
  setLoadDialogOpen: Dispatch<SetStateAction<boolean>>;
  audioReady: boolean;
  audioError: string | null;
  savedMixes: SoundMix[];
  setSavedMixes: Dispatch<SetStateAction<SoundMix[]>>;
  isPlaying: boolean;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
  gainNodesRef: RefObject<Record<string, GainNode | null>>;
  setAudioError: Dispatch<SetStateAction<string | null>>;
}
const LoadMixDialog = ({
  setVolumes,
  setActiveSound,
  loadDialogOpen,
  setLoadDialogOpen,
  audioReady,
  audioError,
  savedMixes,
  setSavedMixes,
  isPlaying,
  setIsPlaying,
  gainNodesRef,
  setAudioError,
}: LoadMixDialogProps) => {
  // Delete a saved mix
  const deleteMix = (mixId: string) => {
    try {
      const mixToDelete = savedMixes.find((mix) => mix.id === mixId);
      const updatedMixes = savedMixes.filter((mix) => mix.id !== mixId);
      setSavedMixes(updatedMixes);
  
      // Update localStorage
      localStorage.setItem("soundMixes", JSON.stringify(updatedMixes));
  
      if (mixToDelete) {
        const undoToast = toast(
          `"${mixToDelete.name}" has been deleted`,
          {
            action: (
              <Button
                onClick={() => {
                  // Undo the delete action by restoring the deleted mix
                  const restoredMixes = [...updatedMixes, mixToDelete];
                  setSavedMixes(restoredMixes);
                  localStorage.setItem("soundMixes", JSON.stringify(restoredMixes));
                  toast.dismiss(undoToast);
                  toast(`"${mixToDelete.name}" has been restored`);
                }}
              >
                Undo
              </Button>
            ),
          }
        );
      }
    } catch (err) {
      console.error("Error deleting mix:", err);
      toast("Failed to delete mix");
    }
  };
  

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(timestamp));
  };
  
  // Load a saved mix
  const loadMix = (mix: SoundMix) => {
    try {
      // Stop all current sounds
      if (isPlaying) {
        Object.values(gainNodesRef.current).forEach((gain) => {
          if (gain) {
            gain.gain.value = 0;
          }
        });
        setIsPlaying(false);
      }

      // Apply the mix settings
      setVolumes({ ...mix.volumes });
      setActiveSound({ ...mix.activeSound });
      // Close the dialog
      setLoadDialogOpen(false);
      toast(`"${mix.name}" has been loaded successfully`);
    } catch (err) {
      console.error("Error loading mix:", err);
      setAudioError("Failed to load mix");
      toast( "Failed to load mix");
    }
  };

  return (
    <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex gap-2"
          disabled={!audioReady || !!audioError}
        >
          <BookmarkPlus className="hidden sm:block h-5 w-5" />
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
                  {savedMixes.map((mix: SoundMix) => (
                    <div
                      key={mix.id}
                      className="flex items-center justify-between p-3 rounded-md border "
                    >
                      <div>
                        <h3 className="font-medium">{mix.name}</h3>
                        <p className="text-xs text-gray-500">
                          {formatDate(mix.createdAt)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => loadMix(mix)}
                              >
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
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteMix(mix.id)}
                              >
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
                <p className="text-sm mt-2">
                  Create your perfect sound blend and save it for later!
                </p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="presets" className="mt-4">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {presetMixes.map((mix) => (
                  <div
                    key={mix.id}
                    className="flex items-center justify-between p-3 rounded-md border "
                  >
                    <div>
                      <h3 className="font-medium dark:text-white">
                        {mix.name}
                      </h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(mix.activeSound)
                          .filter(([_, isActive]) => isActive)
                          .map(([name]) => {
                            const sound = sounds.find((s) => s.name === name);
                            return sound ? (
                              <span
                                key={name}
                                className="text-xs px-1.5 py-0.5 rounded-full dark:bg-gray-900"
                              >
                                <span className="mr-1">{sound.icon}</span>{" "}
                                {name}
                              </span>
                            ) : null;
                          })}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => loadMix(mix)}
                    >
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
  );
};

export default LoadMixDialog;
