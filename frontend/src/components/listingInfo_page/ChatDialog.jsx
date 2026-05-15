import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { notification } from "antd";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InlineLoader } from "@/components/include/LoadingSpinner";
import { BiSend } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import {
  connectChatSocket,
  createChatConversation,
  fetchChatConversations,
  fetchChatMessages,
  markConversationRead,
  sendChatMessage,
} from "@/services/chat";

// ─── Helpers ────────────────────────────────────────────────────────────────

const getId = (value) => {
  if (!value) return null;
  return typeof value === "string" ? value : value._id;
};

const formatTime = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

// ─── Component ───────────────────────────────────────────────────────────────

export function ChatDialog({ isOpen, setIsOpen, listing }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);
  const [presenceMap, setPresenceMap] = useState({});

  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Stable refs so socket handlers always see the latest values without
  // needing to be re-registered (avoids stale closures and socket churn).
  const socketRef = useRef(null);
  const conversationRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Keep conversationRef in sync
  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  const listingId = getId(listing);
  const landlordId = getId(listing?.landlord);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchMessages = useCallback(async (conversationId) => {
    try {
      const nextMessages = await fetchChatMessages(conversationId, "student");
      setMessages(nextMessages);
    } catch {
      notification.error({
        message: "Error loading messages",
        description: "Could not load this conversation.",
      });
    }
  }, []);

  const checkConversation = useCallback(async () => {
    if (!listingId) return;

    try {
      setLoading(true);
      const conversations = await fetchChatConversations("student", {
        propertyId: listingId,
      });

      const existing = conversations.find(
        (item) => getId(item.property) === listingId
      );

      if (existing) {
        setConversation(existing);
        await fetchMessages(existing._id);
      } else {
        setConversation(null);
        setMessages([]);
      }
    } catch {
      notification.error({
        message: "Chat unavailable",
        description: "Could not check the conversation for this listing.",
      });
    } finally {
      setLoading(false);
    }
  }, [fetchMessages, listingId]);

  // ── isMine helper ──────────────────────────────────────────────────────────

  const isMine = useCallback(
    (item) => !!user?._id && getId(item.sender) === user._id,
    [user?._id]
  );

  // ── Socket — created once when the dialog opens, torn down on close ────────

  useEffect(() => {
    if (!isOpen || !isAuthenticated || !user) return;

    const socket = connectChatSocket("student");
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("update_presence", { status: "online" });

      // Re-join active conversation after a reconnect
      const conv = conversationRef.current;
      if (conv?._id) {
        socket.emit("join_conversation", { conversationId: conv._id });
      }
    });

    const handleMessage = (data) => {
      const conv = conversationRef.current;
      if (conv?._id && data?.conversationId !== conv._id) return;

      const incoming = data?.message;
      if (!incoming?._id) return;

      // Skip messages we sent ourselves — they're already in the list as
      // optimistic messages and will be confirmed via the HTTP response.
      if (incoming.sender && String(getId(incoming.sender)) === String(user?._id)) {
        return;
      }

      setMessages((prev) => {
        if (prev.some((item) => item._id === incoming._id)) return prev;
        return [...prev, incoming];
      });

      if (conv?._id && data?.conversationId === conv._id) {
        markConversationRead(conv._id, "student").catch(() => {});
      }
    };

    const handleTyping = (data) => {
      const conv = conversationRef.current;
      if (
        data?.conversationId === conv?._id &&
        String(data.userId) !== String(user?._id)
      ) {
        setIsRecipientTyping(Boolean(data.isTyping));
      }
    };

    const handleMessagesRead = (data) => {
      if (data?.conversationId !== conversationRef.current?._id) return;
      setMessages((prev) =>
        prev.map((item) =>
          isMine(item) ? { ...item, status: "read", pending: false } : item
        )
      );
    };

    const handlePresence = (data) => {
      if (!data?.userId) return;
      setPresenceMap((prev) => ({ ...prev, [data.userId]: data.status }));
    };

    socket.on("new_message", handleMessage);
    socket.on("user_typing", handleTyping);
    socket.on("messages_read", handleMessagesRead);
    socket.on("presence_updated", handlePresence);

    return () => {
      // Stop typing indicator before leaving
      const conv = conversationRef.current;
      if (conv?._id) {
        socket.emit("typing", { conversationId: conv._id, isTyping: false });
        socket.emit("leave_conversation", { conversationId: conv._id });
      }

      clearTimeout(typingTimeoutRef.current);

      socket.off("new_message", handleMessage);
      socket.off("user_typing", handleTyping);
      socket.off("messages_read", handleMessagesRead);
      socket.off("presence_updated", handlePresence);
      socket.disconnect();
      socketRef.current = null;
    };
  // Intentionally omit `conversation` — we use conversationRef to avoid
  // tearing down/rebuilding the socket every time a conversation is loaded.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isAuthenticated, user]);

  // ── Join / leave conversation room when conversation changes ──────────────

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !conversation?._id) return;

    socket.emit("join_conversation", { conversationId: conversation._id });

    return () => {
      socket.emit("typing", { conversationId: conversation._id, isTyping: false });
      socket.emit("leave_conversation", { conversationId: conversation._id });
    };
  }, [conversation?._id]);

  // ── Load data when dialog opens ───────────────────────────────────────────

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      checkConversation();
    }
  }, [checkConversation, isAuthenticated, isOpen]);

  // ── Auto-scroll to newest message ─────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ──────────────────────────────────────────────────────────

  const handleSend = async () => {
    const text = message.trim();
    if (!text || sending) return;

    if (!isAuthenticated) {
      navigate("/auth/user-signin");
      return;
    }

    if (!landlordId || !listingId) {
      notification.error({
        message: "Chat unavailable",
        description: "Landlord information is missing for this listing.",
      });
      return;
    }

    const tempId = `temp-${Date.now()}`;
    setSending(true);
    setMessage("");
    setMessages((prev) => [
      ...prev,
      {
        _id: tempId,
        text,
        sender: { _id: user._id },
        createdAt: new Date().toISOString(),
        pending: true,
      },
    ]);

    try {
      let response;

      if (conversation?._id) {
        response = await sendChatMessage(conversation._id, text, "student");
      } else {
        response = await createChatConversation(
          {
            recipientId: landlordId,
            propertyId: listingId,
            initialMessage: text,
          },
          "student"
        );
      }

      const payload = response;
      const nextConversation = payload?.conversation || payload;
      const sentMessage = payload?.message || payload;

      if (nextConversation?._id) {
        setConversation(nextConversation);
      }

      if (sentMessage?._id && sentMessage?.text) {
        setMessages((prev) => {
          // Replace the optimistic temp message with the confirmed one, then
          // deduplicate by _id in case the socket already added the real message.
          const mapped = prev.map((item) =>
            item._id === tempId ? sentMessage : item
          );
          const seen = new Set();
          return mapped.filter((item) => {
            if (seen.has(item._id)) return false;
            seen.add(item._id);
            return true;
          });
        });
      } else if (nextConversation?._id) {
        setMessages((prev) => prev.filter((item) => item._id !== tempId));
        await fetchMessages(nextConversation._id);
      }
    } catch {
      setMessages((prev) =>
        prev.map((item) =>
          item._id === tempId ? { ...item, pending: false, failed: true } : item
        )
      );
      notification.error({
        message: "Message failed",
        description: "Please try again.",
      });
    } finally {
      setSending(false);
    }
  };

  // ── Typing indicator emission ─────────────────────────────────────────────

  const handleInputChange = (event) => {
    const value = event.target.value;
    setMessage(value);

    const socket = socketRef.current;
    if (!socket || !conversation?._id) return;

    socket.emit("typing", { conversationId: conversation._id, isTyping: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", { conversationId: conversation._id, isTyping: false });
    }, 900);
  };

  // ── Navigation ────────────────────────────────────────────────────────────

  const goToInbox = () => {
    if (user?._id && user?.email) {
      navigate(`/student/${user._id}/inbox`);
      return;
    }

    navigate("/auth/user-signin");
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="flex h-[min(620px,86vh)] flex-col overflow-hidden rounded-[1.25rem] p-0 sm:max-w-md md:max-w-lg">
        <DialogHeader className="bg-primaryBgColor px-4 py-3 text-white">
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <span>Chat with {listing?.landlord?.username || "Landlord"}</span>
            {presenceMap[landlordId] === "online" ? (
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold">
                Online
              </span>
            ) : null}
          </DialogTitle>
        </DialogHeader>

        {/* Messages area */}
        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
          {loading ? (
            <InlineLoader
              label="Loading conversation"
              detail="Syncing messages for this listing."
            />
          ) : null}

          {!loading && messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center">
              <div className="rounded-lg border border-dashed border-slate-200 bg-white px-5 py-6 text-sm text-slate-500">
                Send a message to ask the landlord about this property.
              </div>
            </div>
          ) : null}

          {messages.map((item) => (
            <div
              key={item._id}
              className={`flex ${isMine(item) ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-lg px-4 py-2 text-sm shadow-sm ${
                  isMine(item)
                    ? "bg-primaryBgColor text-white"
                    : "border border-slate-200 bg-white text-slate-800"
                } ${item.failed ? "ring-2 ring-rose-200" : ""}`}
              >
                <p className="leading-6">{item.text}</p>
                <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
                  {item.pending
                    ? "sending…"
                    : item.failed
                    ? "⚠ failed"
                    : formatTime(item.createdAt)}
                </div>
              </div>
            </div>
          ))}

          {isRecipientTyping ? (
            <div className="flex justify-start">
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm">
                {listing?.landlord?.username || "Landlord"} is typing…
              </div>
            </div>
          ) : null}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="flex gap-2 border-t bg-white p-3">
          <input
            value={message}
            onChange={handleInputChange}
            placeholder="Type a message…"
            disabled={sending}
            aria-label="Chat message input"
            className="min-h-11 flex-1 rounded-lg border border-slate-200 px-4 text-sm outline-none transition focus:border-primaryBgColor focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
          />

          <Button
            onClick={handleSend}
            disabled={sending || !message.trim()}
            aria-label="Send message"
            className="min-h-11 rounded-lg bg-primaryBgColor hover:bg-blue-700"
          >
            <BiSend />
          </Button>
        </div>

        <DialogFooter className="flex-row items-center justify-between px-4 py-2 text-xs text-slate-500">
          <span>Messages are private and secure</span>
          <Button variant="outline" onClick={goToInbox}>
            Inbox
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ChatDialog;
