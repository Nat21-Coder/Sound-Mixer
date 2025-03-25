import { LoaderCircle } from "lucide-react";

const LoaderSpinner = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-md flex flex-col items-center">
        <div className="animate-spin mb-4">
          <LoaderCircle className="h-10 w-10 text-primary" />
        </div>
      </div>
    </div>
  );
};
export default LoaderSpinner;
