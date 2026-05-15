import PropTypes from "prop-types";
import { format } from "date-fns";
import { Check, CheckCheck, Send } from "lucide-react";
import { Bs1CircleFill } from "react-icons/bs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function formatChatTime(dateString) {
  if (!dateString) return "";
  try {
    return format(new Date(dateString), "HH:mm");
  } catch {
    return "";
  }
}

export function sortConversationsByRecent(conversations) {
  return [...conversations].sort((a, b) => {
    const dateA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt) : new Date(0);
    const dateB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt) : new Date(0);
    return dateB - dateA;
  });
}

export function ChatMessageStatus({ status, tone = "default" }) {
  switch (status) {
    case "sent":
      return <Check className="size-4 text-slate-400" />;
    case "delivered":
      return <CheckCheck className="size-4 text-slate-400" />;
    case "read":
      return (
        <CheckCheck className={`size-4 ${tone === "light" ? "text-blue-100" : "text-sky-300"}`} />
      );
    case "unread":
      return <Bs1CircleFill className="size-4 fill-sky-400 text-sky-400" />;
    default:
      return null;
  }
}

ChatMessageStatus.propTypes = {
  status: PropTypes.string,
  tone: PropTypes.oneOf(["default", "light"]),
};

export function ConversationListPanel({
  title,
  description,
  conversations,
  selectedConversationId,
  onSelect,
  unreadTotal,
  emptyDescription,
}) {
  return (
    <section className="ln-card flex min-h-[28rem] flex-col overflow-hidden p-0">
      <div className="border-b border-slate-100 bg-white/90 px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
          Messages
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">{description}</p>
          <span className="rounded-md bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
            {unreadTotal} unread
          </span>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="p-3">
          {conversations.length === 0 ? (
            <div className="flex h-44 items-center justify-center text-center">
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-sm text-slate-500">
                {emptyDescription}
              </div>
            </div>
          ) : (
            conversations.map((conversation) => {
              const active = selectedConversationId === conversation._id;
              const unread = conversation.unreadCount || 0;

              return (
                <button
                  key={conversation._id}
                  onClick={() => onSelect(conversation)}
                  className={`mb-2 w-full rounded-lg border p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                    active
                      ? "border-blue-200 bg-blue-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-blue-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-base font-bold text-white shadow-sm">
                      {conversation.recipient?.username?.charAt(0).toUpperCase() || "?"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="truncate font-semibold text-slate-900">
                          {conversation.recipient?.username || "User"}
                        </h2>
                        {unread > 0 ? (
                          <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-blue-700 px-2 text-[11px] font-semibold text-white">
                            {unread}
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 truncate text-sm text-slate-500">
                        {conversation.lastMessage?.text || "No messages yet"}
                      </p>

                      {conversation.property ? (
                        <p className="mt-2 truncate text-xs text-slate-400">
                          {conversation.property.propertyName}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </section>
  );
}

ConversationListPanel.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  conversations: PropTypes.array.isRequired,
  selectedConversationId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  unreadTotal: PropTypes.number,
  emptyDescription: PropTypes.string.isRequired,
};

export function ChatWindowPanel({
  loading,
  conversation,
  messages,
  currentUserId,
  inputValue,
  onInputChange,
  onSend,
  typingLabel,
  sendDisabled,
  emptyTitle,
  emptyDescription,
  placeholder = "Type a message...",
  emptyMode = "panel",
  presenceLabel = "",
}) {
  if (loading) {
    return (
      <div className="space-y-4 rounded-lg border border-slate-200/70 bg-white/92 p-5 shadow-sm backdrop-blur">
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
      </div>
    );
  }

  const recipientName = conversation?.recipient?.username || "User";
  const propertyName = conversation?.property?.propertyName || "";

  return (
    <div className="relative flex h-full min-h-[560px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white/95 shadow-[0_12px_34px_rgba(15,23,42,0.07)] backdrop-blur">
      <div className="border-b border-slate-100 bg-white/90 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="ln-icon-tile text-base font-bold">
            {recipientName.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-base font-semibold text-slate-900">{recipientName}</h2>
              {presenceLabel ? (
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                  {presenceLabel}
                </span>
              ) : null}
            </div>
            {propertyName ? (
              <p className="truncate text-sm text-slate-500">Re: {propertyName}</p>
            ) : (
              <p className="text-sm text-slate-500">Conversation</p>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="relative min-h-0 flex-1 bg-slate-50">
        <div className="absolute inset-0">
          <div
            className="h-full w-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url(/chat-background.jpg)" }}
          />
          <div className="absolute inset-0 bg-white/68" />
        </div>

        <div className="relative z-10 flex min-h-full flex-col gap-4 px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <div
                className={`max-w-md rounded-lg border border-dashed border-slate-200 bg-white/90 px-6 py-10 text-center shadow-sm backdrop-blur ${
                  emptyMode === "compact" ? "px-5 py-6" : ""
                }`}
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <ChatMessageStatus status="unread" />
                </div>
                <p className="text-base font-semibold text-slate-900">{emptyTitle}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{emptyDescription}</p>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const mine = String(message.sender?._id || message.sender) === String(currentUserId);

              return (
                <div key={message._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[78%] rounded-lg px-4 py-3 shadow-sm ring-1 ${
                      mine
                        ? "bg-blue-700 text-white ring-blue-500/20"
                        : "bg-white text-slate-900 ring-slate-200"
                    } ${message.failed ? "ring-rose-300" : ""}`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p>

                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className={`text-[11px] ${mine ? "text-blue-100" : "text-slate-400"}`}>
                        {message.pending
                          ? "sending..."
                          : message.failed
                          ? "failed"
                          : formatChatTime(message.createdAt)}
                      </p>

                      {mine && !message.pending ? (
                        <ChatMessageStatus
                          status={message.failed ? "unread" : message.status || "sent"}
                          tone="light"
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {typingLabel ? (
            <div className="flex justify-start">
              <div className="rounded-lg border border-slate-200 bg-white/95 px-4 py-2 text-sm text-slate-500 shadow-sm backdrop-blur">
                {typingLabel}
              </div>
            </div>
          ) : null}
        </div>
      </ScrollArea>

      <div className="border-t border-slate-100 bg-white p-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={onInputChange}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSend();
              }
            }}
            placeholder={placeholder}
            className="h-11 flex-1 rounded-lg border border-slate-200 bg-white/85 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
          <Button
            onClick={onSend}
            disabled={sendDisabled}
            className="h-11 rounded-lg bg-blue-700 px-5 hover:bg-blue-800"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

ChatWindowPanel.propTypes = {
  loading: PropTypes.bool,
  conversation: PropTypes.object,
  messages: PropTypes.array.isRequired,
  currentUserId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  inputValue: PropTypes.string.isRequired,
  onInputChange: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired,
  typingLabel: PropTypes.string,
  sendDisabled: PropTypes.bool,
  emptyTitle: PropTypes.string.isRequired,
  emptyDescription: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  emptyMode: PropTypes.oneOf(["panel", "compact"]),
  presenceLabel: PropTypes.string,
};
