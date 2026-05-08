import { useEffect, useState } from "react";
import { api } from "../../api/client";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { AGE_GROUPS } from "../../data/ageGroups";

interface Child {
  id: number;
  name: string;
  age: number;
}

type MessageType = "individual" | "multiple" | "group";

interface MessageComposeProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function MessageCompose({ onClose, onSuccess }: MessageComposeProps) {
  const [messageType, setMessageType] = useState<MessageType>("individual");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedChildren, setSelectedChildren] = useState<number[]>([]);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const response = await api.get("/children");
      setChildren(response.data);
    } catch (error) {
      console.error("Failed to fetch children:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      alert("Please enter a message");
      return;
    }

    setLoading(true);

    try {
      if (messageType === "individual" && selectedChild) {
        await api.post("/messages/send-to-parent", {
          message_text: message,
          child_id: selectedChild,
        });
      } else if (messageType === "multiple") {
        if (selectedChildren.length === 0) {
          alert("Please select at least one child");
          setLoading(false);
          return;
        }

        await api.post("/messages/send-to-multiple", {
          message_text: message,
          child_ids: selectedChildren,
        });
      } else if (messageType === "group" && selectedGroup) {
        await api.post("/messages/send-to-group", {
          message_text: message,
          group_name: selectedGroup,
        });
      } else {
        alert("Please complete the message details");
        setLoading(false);
        return;
      }

      onSuccess();
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const toggleChildSelection = (childId: number) => {
    setSelectedChildren((current) =>
      current.includes(childId)
        ? current.filter((id) => id !== childId)
        : [...current, childId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-slate-900">Compose Message</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Message Type Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Send To
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setMessageType("individual")}
                className={`p-3 rounded-lg border-2 transition text-sm font-medium ${
                  messageType === "individual"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                Individual Parent
              </button>
              <button
                onClick={() => setMessageType("multiple")}
                className={`p-3 rounded-lg border-2 transition text-sm font-medium ${
                  messageType === "multiple"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                Multiple Children
              </button>
              <button
                onClick={() => setMessageType("group")}
                className={`p-3 rounded-lg border-2 transition text-sm font-medium ${
                  messageType === "group"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                Whole Class
              </button>
            </div>
          </div>

          {/* Recipient Selection */}
          {messageType === "individual" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Select Child
              </label>
              <select
                value={selectedChild || ""}
                onChange={(e) => setSelectedChild(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">Choose a child...</option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name} (Age {child.age})
                  </option>
                ))}
              </select>
            </div>
          )}

          {messageType === "multiple" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Select Children
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-3">
                  {children.map((child) => (
                    <label
                      key={child.id}
                      className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedChildren.includes(child.id)}
                        onChange={() => toggleChildSelection(child.id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-slate-700">
                        {child.name} (Age {child.age})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messageType === "group" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Select Class
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">Choose a class...</option>
                {AGE_GROUPS.map((group) => (
                  <option key={group.key} value={group.key}>
                    {group.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-2">
                Message will be sent to all parents in this age group
              </p>
            </div>
          )}

          {/* Message Text */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={6}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
            />
            <p className="text-xs text-slate-500 mt-2">
              {message.length} characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition font-medium"
            >
              Cancel
            </button>
            <Button
              onClick={handleSendMessage}
              disabled={loading || !message.trim()}
              className={`px-4 py-2 rounded-lg text-white font-medium transition ${
                loading || !message.trim()
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
