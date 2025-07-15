import { useState } from 'react';
import { Upload, Loader2, AlertCircle } from 'lucide-react';

export default function PDFViewer({ folderId, onFileUpload }: { folderId: string; onFileUpload: (file: { id: string; name: string }) => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [totalProgress, setTotalProgress] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Reset states
    setIsLoading(true);
    setError(null);
    setUploadProgress({});
    setTotalProgress(0);

    try {
      const uploadPromises = files.map(async (file) => {
        // Validate file type and size
        if (!file.type.includes('pdf')) {
          throw new Error(`${file.name} is not a PDF file`);
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`${file.name} exceeds 10MB limit`);
        }

        const formData = new FormData();
        formData.append("file", file);

        // Upload the file
        const uploadRes = await fetch(`http://localhost:8000/upload/${folderId}`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          throw new Error(errorData.detail || `Failed to upload ${file.name}`);
        }

        const uploadData = await uploadRes.json();
        
        // Update progress
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 100
        }));
        
        // Validate the file
        const validateRes = await fetch(`http://localhost:8000/validate-file/${uploadData.id}`);
        if (!validateRes.ok || !(await validateRes.json()).valid) {
          throw new Error(`Failed to validate ${file.name}`);
        }

        // Notify parent component
        onFileUpload({ id: uploadData.id, name: uploadData.name });
        return uploadData;
      });

      // Upload all files concurrently
      await Promise.all(uploadPromises);
      setTotalProgress(100);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "File processing failed");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalProgress = () => {
    const values = Object.values(uploadProgress);
    return values.length ? Math.round(values.reduce((a, b) => a + b) / values.length) : 0;
  };

  return (
    <div className="bg-[#1A1D2E] p-6 rounded-lg">
      <div className="mb-4">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload size={24} className="text-gray-400 mb-2" />
            <p className="mb-2 text-sm text-gray-400">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">Multiple PDF files supported (max 10MB each)</p>
          </div>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
            multiple
          />
        </label>
      </div>

      {/* Status Messages */}
      {isLoading && (
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-blue-400">
            <div className="flex items-center gap-2">
              <Loader2 size={20} className="animate-spin" />
              <span>Processing files...</span>
            </div>
            <span>{calculateTotalProgress()}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${calculateTotalProgress()}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-red-400 mb-4 p-3 bg-red-900/20 rounded-lg">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-sm text-red-300 hover:text-red-200 mt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}