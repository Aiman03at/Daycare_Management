import Card from "../../components/Card";

interface Message {
  id: number;
  sender_id: number;
  sender_name: string;
  message_text: string;
  created_at: string;
  is_archived: boolean;
  unread_count?: number;
}

interface MessageListProps {
  messages: Message[];
  selectedMessage: Message | null;
  onSelectMessage: (message: Message) => void;
  loading: boolean;
}

export default function MessageList({
  messages,
  selectedMessage,
  onSelectMessage,
  loading,
}: MessageListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <Card className="p-0 max-h-[600px] overflow-hidden flex flex-col">
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <p className="text-slate-500">Loading messages...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex items-center justify-center p-8">
          <p className="text-slate-500">No messages yet</p>
        </div>
      ) : (
        <div className="overflow-y-auto flex-1">
          {messages.map((msg) => (
            <button
              key={msg.id}
              onClick={() => onSelectMessage(msg)}
              className={`w-full text-left border-b border-slate-100 p-4 hover:bg-slate-50 transition ${
                selectedMessage?.id === msg.id ? "bg-blue-50" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-medium text-slate-900 truncate flex-1">
                  {msg.sender_name}
                </h3>
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  {formatDate(msg.created_at)}
                </span>
              </div>
              <p className="text-sm text-slate-600 line-clamp-2">
                {msg.message_text}
              </p>
              {msg.unread_count && msg.unread_count > 0 && (
                <div className="mt-2">
                  <span className="inline-block bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {msg.unread_count} unread
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
