import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SoundMix } from "@/types";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
interface SaveMixDialogProps {
  saveDialogOpen: boolean;
  setSaveDialogOpen: Dispatch<SetStateAction<boolean>>;
  audioReady: boolean;
  audioError: string | null;
  newMixName: string;
  activeSound: Record<string, boolean>;
  volumes: any;
  savedMixes: SoundMix[];
  setSavedMixes: Dispatch<SetStateAction<SoundMix[]>>;
  setNewMixName: Dispatch<SetStateAction<string>>;
}
const SaveMixDialog = ({
  saveDialogOpen,
  setSaveDialogOpen,
  audioReady,
  audioError,
  newMixName,
  activeSound,
  volumes,
  savedMixes,
  setSavedMixes,
  setNewMixName,
}: SaveMixDialogProps) => {
  // Save current mix
  const saveMix = () => {
    if (!newMixName.trim()) {
      toast("Please enter a name for your mix");
      return;
    }

    // Check if any sounds are active
    const hasActiveSounds = Object.values(activeSound).some(
      (isActive) => isActive
    );
    if (!hasActiveSounds) {
      toast("Please select at least one sound before saving");
      return;
    }

    try {
      const newMix: SoundMix = {
        id: `mix-${Date.now()}`,
        name: newMixName.trim(),
        activeSound: { ...activeSound },
        volumes: { ...volumes },
        createdAt: Date.now(),
      };

      const updatedMixes = [...savedMixes, newMix];
      setSavedMixes(updatedMixes);

      // Save to localStorage
      localStorage.setItem("soundMixes", JSON.stringify(updatedMixes));

      // Reset form and close dialog
      setNewMixName("");
      setSaveDialogOpen(false);
      toast(`"${newMixName.trim()}" has been saved successfully`);
    } catch (err) {
      console.error("Error saving mix:", err);
      toast( "Failed to save mix");
    }
  };
  return (
    <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex gap-2"
          disabled={!audioReady || !!audioError}
        >
          <Save className="hidden sm:block h-5 w-5" />
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
  );
};
export default SaveMixDialog;
