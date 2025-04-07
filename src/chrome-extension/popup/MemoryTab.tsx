import { useState, useEffect, useCallback } from "react";
import { MemoryItem } from "../types/memory";
import { memoryDb } from "../storage/memoryDatabase";
import { getCompactLocaleDateTime } from "../util/datetime";
import { Tooltip } from "../components/Tooltip";

const primaryButtonClasses =
  "px-2 py-2 bg-gray-200/80 text-gray-900 rounded-md hover:bg-gray-300/80 disabled:bg-gray-500/40 disabled:text-gray-400";
const destructiveButtonClasses = `text-red-400 hover:text-red-700 text-xs p-2`;
const checkboxLabelClasses =
  "flex items-center space-x-2 text-sm text-gray-300 cursor-pointer";
const textareaClasses =
  "text-sm block w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-white/90 bg-[#1f1f1f]/50 text-gray-200 resize-y placeholder-gray-500 disabled:opacity-50";
const editableTextClasses =
  "cursor-pointer hover:bg-gray-700/30 rounded px-1 py-0.5";

export const MemoryTab = () => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [newContent, setNewContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingMemoryId, setEditingMemoryId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  // Load memories on component mount
  const loadMemories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allMemories = await memoryDb.getAllMemories();
      setMemories(allMemories);
    } catch (err) {
      console.error("Error loading memories:", err);
      setError("Failed to load memories.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  // Handler to add a new memory
  const handleAddMemory = useCallback(async () => {
    setError(null);
    if (!newContent.trim()) {
      setError("Please enter the memory content.");
      return;
    }

    setIsLoading(true);
    try {
      await memoryDb.addMemory({ content: newContent });
      setNewContent("");
      await loadMemories(); // Refresh the list
    } catch (err) {
      console.error("Error adding memory:", err);
      setError(
        `Failed to add memory: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  }, [newContent, loadMemories]);

  // Handler to toggle the active state of a memory
  const handleToggleActive = useCallback(
    async (id: number, currentActiveState: boolean) => {
      setError(null);
      setIsLoading(true);
      try {
        await memoryDb.updateMemory(id, { active: !currentActiveState });
        await loadMemories(); // Refresh the list
      } catch (err) {
        console.error("Error updating memory active state:", err);
        setError(
          `Failed to update memory: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      } finally {
        setIsLoading(false);
      }
    },
    [loadMemories]
  );

  // Handler to start editing a memory's content
  const handleEditStart = useCallback((id: number, content: string) => {
    setEditingMemoryId(id);
    setEditText(content);
    setError(null);
  }, []);

  // Handler to update the edit text state
  const handleEditChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setEditText(e.target.value);
    },
    []
  );

  // Handler to save the edited memory content on blur
  const handleEditSave = useCallback(
    async (id: number) => {
      const originalMemory = memories.find((m) => m.id === id);
      if (
        originalMemory &&
        editText.trim() &&
        editText.trim() !== originalMemory.content
      ) {
        setError(null);
        setIsLoading(true);
        try {
          await memoryDb.updateMemory(id, { content: editText.trim() });
          await loadMemories();
        } catch (err) {
          console.error("Error updating memory content:", err);
          setError(
            `Failed to update memory content: ${
              err instanceof Error ? err.message : "Unknown error"
            }`
          );
        } finally {
          setIsLoading(false);
        }
      }
      setEditingMemoryId(null);
      setEditText("");
    },
    [loadMemories, memories, editText]
  );

  // Handler to delete a memory
  const handleDeleteMemory = useCallback(
    async (id: number) => {
      setError(null);
      if (!confirm("Are you sure you want to delete this memory item?")) {
        return;
      }
      setIsLoading(true);
      try {
        await memoryDb.deleteMemory(id);
        await loadMemories();
      } catch (err) {
        console.error("Error deleting memory:", err);
        setError(
          `Failed to delete memory: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      } finally {
        setIsLoading(false);
      }
    },
    [loadMemories]
  );

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-lg font-semibold text-gray-200">Manage Memory</h2>
        <Tooltip>
          <p className="mb-1">
            Active memories are added to the end of all system prompts.
          </p>
          <p className="mb-1">
            Use it to change AI behavior, formatting, or for it to remember
            things.
          </p>
          <p>
            Memories can also be managed through chat with models that support
            tool calling.
          </p>
          <p>
            Saying in chat "remember this" or "add memory" will add a new memory
            item.
          </p>
        </Tooltip>
      </div>

      {/* Add New Memory Form */}
      <div className="mb-1 p-2 border border-gray-700 rounded bg-[#272522]">
        <h3 className="text-md font-medium mb-2 text-gray-300">
          Add New Memory
        </h3>
        <div className="space-y-2">
          <textarea
            placeholder="Memory Content"
            value={newContent}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setNewContent(e.target.value)
            }
            rows={3}
            disabled={isLoading}
            className={textareaClasses}
          />
          <button
            onClick={handleAddMemory}
            disabled={isLoading || !newContent.trim()}
            className={primaryButtonClasses}
          >
            {isLoading ? "Adding..." : "Add Memory"}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-3">Error: {error}</p>}
      </div>

      {/* Memory List */}
      <div className="flex-1 overflow-y-auto mt-2">
        <h3 className="text-md font-medium mb-2 text-gray-300">
          Stored Memories ({memories.length})
        </h3>
        {isLoading && memories.length === 0 && (
          <p className="text-gray-400">Loading...</p>
        )}
        {!isLoading && memories.length === 0 && (
          <p className="text-gray-400">No memories stored yet.</p>
        )}
        <ul className="space-y-2">
          {memories.map((item) => (
            <li
              key={item.id}
              className="p-2 border border-gray-600 rounded bg-[#2d2b28] flex flex-col space-y-1"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 mr-4">
                  {editingMemoryId === item.id ? (
                    <textarea
                      value={editText}
                      onChange={handleEditChange}
                      onBlur={() => handleEditSave(item.id)}
                      className={`${textareaClasses} text-xs h-auto`}
                      rows={3}
                      autoFocus
                      disabled={isLoading}
                      aria-label="Edit memory content"
                    />
                  ) : (
                    <p
                      className={`text-xs text-gray-200 whitespace-pre-wrap ${editableTextClasses}`}
                      onClick={() =>
                        !isLoading && handleEditStart(item.id, item.content)
                      }
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (
                          !isLoading &&
                          (e.key === "Enter" || e.key === " ")
                        ) {
                          e.preventDefault();
                          handleEditStart(item.id, item.content);
                        }
                      }}
                      title="Click to edit"
                    >
                      {item.content}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <label className={checkboxLabelClasses}>
                    <input
                      type="checkbox"
                      checked={item.active}
                      onChange={() => handleToggleActive(item.id, item.active)}
                      disabled={isLoading}
                    />
                    <span>Active</span>
                  </label>

                  <button
                    onClick={() => handleDeleteMemory(item.id)}
                    disabled={isLoading}
                    title="Delete Memory"
                    className={destructiveButtonClasses}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-500 pt-1 border-t border-gray-700/50">
                <span>Created: {getCompactLocaleDateTime(item.createdAt)}</span>
                <span className="ml-4">
                  Updated: {getCompactLocaleDateTime(item.updatedAt)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MemoryTab;
