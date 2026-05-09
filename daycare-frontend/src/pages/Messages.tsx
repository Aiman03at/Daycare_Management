import { useEffect, useState } from "react";
import { api } from "../api/client";
import Card from "../components/Card";
import Button from "../components/Button";
import MessageCompose from "./components/MessageCompose";
import MessageList from "./components/MessageList";

interface Message {
  id: number;
  sender_id: number;
  sender_name: string;
  message_text: string;
  child_id: number | null;
  group_name: string | null;
  created_at: string;
  is_archived: boolean;
  unread_count?: number;
  recipients?: any[];
  replies?: Reply[];
}

interface Reply {
  id: number;
  sender_id: number;
  sender_name: string;
  reply_text: string;
  created_at: string;
}

export default function MessagesPage() {
  const [, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [filter, setFilter] = useState<"inbox" | "archived">("inbox");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const archived = filter === "archived";
      const response = await api.get("/messages", {
        params: { archived },
      });
      setMessages(response.data);
      setFilteredMessages(response.data);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [filter]);

  const loadMessageThread = async (messageId: number) => {
    try {
      const response = await api.get(`/messages/${messageId}`);
      setSelectedMessage(response.data);
      setReplyText("");
    } catch (error) {
      console.error("Failed to load message thread:", error);
    }
  };

  const handleArchive = async (messageId: number) => {
    try {
      await api.put(`/messages/${messageId}/archive`);
      await fetchMessages();
    } catch (error) {
      console.error("Failed to archive message:", error);
    }
  };

  const handleUnarchive = async (messageId: number) => {
    try {
      await api.put(`/messages/${messageId}/unarchive`);
      await fetchMessages();
    } catch (error) {
      console.error("Failed to unarchive message:", error);
    }
  };

  const handleDelete = async (messageId: number) => {
    if (confirm("Are you sure you want to delete this message?")) {
      try {
        await api.delete(`/messages/${messageId}`);
        await fetchMessages();
        setSelectedMessage(null);
      } catch (error) {
        console.error("Failed to delete message:", error);
      }
    }
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyText.trim()) {
      return;
    }

    try {
      setReplyLoading(true);
      await api.post(`/messages/${selectedMessage.id}/reply`, {
        reply_text: replyText.trim(),
      });
      await loadMessageThread(selectedMessage.id);
      await fetchMessages();
    } catch (error) {
      console.error("Failed to send reply:", error);
    } finally {
      setReplyLoading(false);
    }
  };

  const handleComposeSuccess = () => {
    setShowCompose(false);
    fetchMessages();
  };

  return (
    <div className="space-y-6">
      <Card className="p-0">
        <div className="border-b border-slate-100 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Messages</h2>
            <p className="mt-1 text-sm text-slate-500">
              Send messages to parents and manage conversations
            </p>
          </div>
          <Button
            onClick={() => setShowCompose(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            + Compose Message
          </Button>
        </div>

        <div className="flex gap-2 px-6 py-4 border-b border-slate-100">
          <button
            onClick={() => setFilter("inbox")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              filter === "inbox"
                ? "bg-blue-100 text-blue-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Inbox
          </button>
          <button
            onClick={() => setFilter("archived")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              filter === "archived"
                ? "bg-blue-100 text-blue-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Archived
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <MessageList
            messages={filteredMessages}
            selectedMessage={selectedMessage}
            onSelectMessage={(message) => loadMessageThread(message.id)}
            loading={loading}
          />
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          {selectedMessage ? (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    {selectedMessage.sender_name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {new Date(selectedMessage.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {filter === "inbox" ? (
                    <button
                      onClick={() => handleArchive(selectedMessage.id)}
                      className="px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
                    >
                      Archive
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnarchive(selectedMessage.id)}
                      className="px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
                    >
                      Unarchive
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(selectedMessage.id)}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg mb-4">
                <p className="text-slate-700 whitespace-pre-wrap">
                  {selectedMessage.message_text}
                </p>
              </div>

              {selectedMessage.recipients && selectedMessage.recipients.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Recipients:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMessage.recipients.map((recipient: any, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm"
                      >
                        {recipient.recipient_email || recipient.recipient_phone || "Unknown"}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedMessage.group_name && (
                <div className="mb-4">
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Group:</span> {selectedMessage.group_name}
                  </p>
                </div>
              )}

              {selectedMessage.replies && selectedMessage.replies.length > 0 && (
                <div className="space-y-3 border-t border-slate-200 pt-4">
                  <h4 className="text-sm font-medium text-slate-700">Replies</h4>
                  {selectedMessage.replies.map((reply) => (
                    <div key={reply.id} className="rounded-2xl bg-slate-50 p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-slate-900">
                          {reply.sender_name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(reply.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-slate-700">
                        {reply.reply_text}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-5 border-t border-slate-200 pt-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Reply to this message
                </label>
                <textarea
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
                  placeholder="Write a reply..."
                />
                <div className="mt-3 flex justify-end">
                  <Button
                    onClick={handleReply}
                    disabled={replyLoading || !replyText.trim()}
                    className="bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {replyLoading ? "Sending..." : "Send Reply"}
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-slate-500">
                {loading ? "Loading messages..." : "Select a message to view details"}
              </p>
            </Card>
          )}
        </div>
      </div>

      {showCompose && (
        <MessageCompose
          onClose={() => setShowCompose(false)}
          onSuccess={handleComposeSuccess}
        />
      )}
    </div>
  );
}
