import { sounds } from "@/constants";

const DisplayCurrentPlayingSounds = ({
  activeSound,
}: {
  activeSound: Record<string, boolean>;
}) => {
  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
      <h3 className="font-medium mb-2">Currently Playing:</h3>
      <div className="flex flex-wrap gap-2">
        {Object.entries(activeSound)
          .filter(([_, isActive]) => isActive)
          .map(([name]) => {
            const sound = sounds.find((s) => s.name === name);
            return sound ? (
              <span
                key={name}
                className={`dark:bg-gray-600 bg-gray-900 text-white px-3 py-1 rounded-full text-sm flex items-center`}
              >
                <span className="mr-1">{sound.icon}</span> {name}
              </span>
            ) : null;
          })}
        {Object.values(activeSound).filter(Boolean).length === 0 && (
          <span className="text-gray-500 dark:text-gray-400 italic">
            No sounds selected
          </span>
        )}
      </div>
    </div>
  );
};

export default DisplayCurrentPlayingSounds;
