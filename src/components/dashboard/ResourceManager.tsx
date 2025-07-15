import { BookOpen, MoreVertical } from 'lucide-react';
import { useState } from 'react';

export default function ResourceManager({
    folderId,
    resources
}: {
    folderId: string;
    resources: Array<{ id: string; name: string }>;
}) {
    const [hoveredResource, setHoveredResource] = useState<string | null>(null);

    return (
        <div className="p-4 text-white">
            {/* Resources List */}
            <div className="space-y-2">
                <h3 className="font-bold mb-2">Your Resources:</h3>
                {resources.map((resource) => (
                    <div 
                        key={resource.id} 
                        className="flex items-center justify-between p-2 hover:bg-[#1A1D2E] rounded group"
                        onMouseEnter={() => setHoveredResource(resource.id)}
                        onMouseLeave={() => setHoveredResource(null)}
                    >
                        <div className="flex items-center gap-2">
                            <BookOpen size={16} />
                            <span>{resource.name}</span>
                        </div>
                        {hoveredResource === resource.id && (
                            <div className="relative">
                                <button 
                                    className="p-1 hover:bg-[#2A2D3E] rounded"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const menu = e.currentTarget.nextElementSibling as HTMLElement;
                                        if (menu) {
                                            menu.classList.toggle('hidden');
                                        }
                                    }}
                                >
                                    <MoreVertical size={16} />
                                </button>
                                <div className="absolute right-0 mt-1 bg-[#2A2D3E] rounded-lg shadow-lg py-1 w-32 hidden">
                                    <button className="w-full px-4 py-2 text-left hover:bg-[#353849] text-sm">
                                        Rename
                                    </button>
                                    <button className="w-full px-4 py-2 text-left hover:bg-[#353849] text-sm text-red-400">
                                        Remove
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}