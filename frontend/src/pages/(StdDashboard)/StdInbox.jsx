import { useEffect, useRef, useState } from "react";
import { Empty, Spin, notification } from "antd";
import { DashboardShell } from "@/components/ui/page-shell";
import StudentSidebar from "@/components/student_dashboard/StudentSidebar";
import { useAuthStore } from "@/store/authStore";
import {
  connectChatSocket,
  fetchChatConversations,
  fetchChatMessages,
  markConversationRead,
  sendChatMessage,
} from "@/services/chat";
import {
  ChatWindowPanel,
  ConversationListPanel,
  sortConversationsByRecent,
} from "@/components/chat/inbox-ui";

const optimisticMessage = (userId, text) => ({
  _id: `temp-${Date.now()}`,
  text,
  sender: { _id: userId },
  createdAt: new Date().toISOString(),
  pending: true,
});

const StdInbox = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);
  const [presenceMap, setPresenceMap] = useState({});
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return undefined;

    let mounted = true;
    const nextSocket = connectChatSocket("student");

    nextSocket.on("connect", () => {
      nextSocket.emit("update_presence", { status: "online" });
    });

    nextSocket.on("connect_error", () => {
      notification.error({
        message: "Connection error",
        description: "Real-time chat is temporarily unavailable.",
      });
    });

    if (mounted) {
      setSocket(nextSocket);
    }

    return () => {
      mounted = false;
      clearTimeout(typingTimeoutRef.current);
      nextSocket.disconnect();
      setSocket(null);
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadConversations = async () => {
      try {
        setLoading(true);
        const list = await fetchChatConversations("student");
        setConversations(list);
        setSelectedConversation((current) => {
          if (current) {
            return list.find((item) => item._id === current._id) || list[0] || null;
          }
          return list[0] || null;
        });
      } catch {
        notification.error({
          message: "Error loading chats",
          description: "Could not load your conversations.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!selectedConversation?._id) {
      setMessages([]);
      setIsRecipientTyping(false);
      return;
    }

    const loadMessages = async () => {
      try {
        setMessageLoading(true);
        const nextMessages = await fetchChatMessages(selectedConversation._id, "student");
        setMessages(nextMessages);
        await markConversationRead(selectedConversation._id, "student");
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation._id === selectedConversation._id
              ? { ...conversation, unreadCount: 0 }
              : conversation
          )
        );
      } catch {
        notification.error({
          message: "Error loading messages",
          description: "Could not load this conversation.",
        });
      } finally {
        setMessageLoading(false);
      }
    };

    loadMessages();
  }, [selectedConversation?._id]);

  useEffect(() => {
    if (!socket || !selectedConversation?._id) return undefined;

    socket.emit("join_conversation", { conversationId: selectedConversation._id });

    return () => {
      socket.emit("leave_conversation", { conversationId: selectedConversation._id });
    };
  }, [socket, selectedConversation?._id]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleNewMessage = (data) => {
      setConversations((prev) => {
        const next = prev.map((conversation) => {
          if (conversation._id !== data.conversationId) return conversation;
          const isCurrent = selectedConversation?._id === data.conversationId;
          return {
            ...conversation,
            lastMessage: data.message,
            unreadCount: isCurrent ? 0 : (conversation.unreadCount || 0) + 1,
          };
        });
        return sortConversationsByRecent(next);
      });

      if (selectedConversation?._id !== data.conversationId || !data.message?._id) {
        return;
      }

      setMessages((prev) => {
        const exists = prev.some((item) => item._id === data.message._id);
        if (exists) return prev;
        const withoutTemp = prev.filter(
          (item) =>
            !(
              item.pending &&
              String(item.sender?._id || item.sender) === String(user?._id) &&
              item.text === data.message.text
            )
        );
        return [...withoutTemp, data.message];
      });

      markConversationRead(selectedConversation._id, "student").catch(() => {});
    };

    const handleNewConversation = async () => {
      try {
        const nextConversations = await fetchChatConversations("student");
        setConversations(nextConversations);
      } catch {
        // A background refresh can fail silently until the next socket update.
      }
    };

    const handleMessagesRead = (data) => {
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation._id === data.conversationId ? { ...conversation, unreadCount: 0 } : conversation
        )
      );

      if (selectedConversation?._id !== data.conversationId) return;

      setMessages((prev) =>
        prev.map((message) =>
          String(message.sender?._id || message.sender) === String(user?._id)
            ? { ...message, status: "read" }
            : message
        )
      );
    };

    const handleTyping = (data) => {
      if (
        data.conversationId === selectedConversation?._id &&
        String(data.userId) !== String(user?._id)
      ) {
        setIsRecipientTyping(Boolean(data.isTyping));
      }
    };

    const handlePresence = (data) => {
      if (!data?.userId) return;
      setPresenceMap((prev) => ({ ...prev, [data.userId]: data.status }));
    };

    socket.on("new_message", handleNewMessage);
    socket.on("new_conversation", handleNewConversation);
    socket.on("messages_read", handleMessagesRead);
    socket.on("user_typing", handleTyping);
    socket.on("presence_updated", handlePresence);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("new_conversation", handleNewConversation);
      socket.off("messages_read", handleMessagesRead);
      socket.off("user_typing", handleTyping);
      socket.off("presence_updated", handlePresence);
    };
  }, [socket, selectedConversation?._id, user?._id]);

  useEffect(() => {
    const unreadTotal = conversations.reduce((total, conversation) => total + (conversation.unreadCount || 0), 0);
    document.title = unreadTotal > 0 ? `(${unreadTotal}) Chats` : "Chats";
  }, [conversations]);

  const handleConversationSelect = async (conversation) => {
    setSelectedConversation(conversation);
    if ((conversation.unreadCount || 0) <= 0) return;

    try {
      await markConversationRead(conversation._id, "student");
      setConversations((prev) =>
        prev.map((item) => (item._id === conversation._id ? { ...item, unreadCount: 0 } : item))
      );
    } catch {
      // Keep the conversation open even if the read-sync request fails.
    }
  };

  const handleInputChange = (event) => {
    const value = event.target.value;
    setMessageText(value);

    if (!socket || !selectedConversation?._id) return;
    socket.emit("typing", { conversationId: selectedConversation._id, isTyping: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", { conversationId: selectedConversation._id, isTyping: false });
    }, 900);
  };

  const handleSend = async () => {
    const text = messageText.trim();
    if (!text || !selectedConversation?._id || !user?._id) return;

    const tempMessage = optimisticMessage(user._id, text);
    setMessageText("");
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const response = await sendChatMessage(selectedConversation._id, text, "student");
      setMessages((prev) => {
        const withoutTemp = prev.filter((item) => item._id !== tempMessage._id && item._id !== response._id);
        return [...withoutTemp, response];
      });
      setConversations((prev) =>
        sortConversationsByRecent(
          prev.map((conversation) =>
            conversation._id === selectedConversation._id
              ? { ...conversation, lastMessage: response }
              : conversation
          )
        )
      );
      socket?.emit("typing", { conversationId: selectedConversation._id, isTyping: false });
    } catch {
      setMessages((prev) =>
        prev.map((item) => (item._id === tempMessage._id ? { ...item, pending: false, failed: true } : item))
      );
      notification.error({
        message: "Message failed",
        description: "Please try again.",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <p className="text-sm font-medium text-slate-700">Please log in to view your messages</p>
        </div>
      </div>
    );
  }

  const unreadTotal = conversations.reduce((total, conversation) => total + (conversation.unreadCount || 0), 0);
  const recipientStatus =
    presenceMap[selectedConversation?.recipient?._id] === "online" ? "Online" : "";

  return (
    <DashboardShell
      sidebar={<StudentSidebar />}
      sidebarWidth="18rem"
      eyebrow="Messages"
      title="Inbox"
      description="Stay close to every landlord reply while you compare places and plan visits."
      actions={
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 shadow-sm">
          {unreadTotal} unread
        </div>
      }
    >
      {loading && conversations.length === 0 ? (
        <div className="flex min-h-[70vh] items-center justify-center rounded-lg border border-slate-200 bg-white/92 shadow-sm backdrop-blur">
          <Spin size="large" />
        </div>
      ) : (
        <div className="grid min-h-[calc(100vh-2.5rem)] gap-4 xl:grid-cols-[360px_1fr]">
          <ConversationListPanel
            title="All conversations"
            description="Keep every housing conversation in one clear student workspace."
            conversations={conversations}
            selectedConversationId={selectedConversation?._id}
            onSelect={handleConversationSelect}
            unreadTotal={unreadTotal}
            emptyDescription="Start a conversation from a property listing page."
          />

          <section className="min-h-0">
            {selectedConversation ? (
              <ChatWindowPanel
                loading={messageLoading}
                conversation={selectedConversation}
                messages={messages}
                currentUserId={user?._id}
                inputValue={messageText}
                onInputChange={handleInputChange}
                onSend={handleSend}
                typingLabel={isRecipientTyping ? `${selectedConversation.recipient?.username || "Landlord"} is typing...` : ""}
                sendDisabled={!messageText.trim()}
                emptyTitle="No messages yet"
                emptyDescription="Start the conversation with this landlord."
                presenceLabel={recipientStatus}
              />
            ) : conversations.length > 0 ? (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white/92 shadow-sm backdrop-blur">
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-slate-900">Select a conversation</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Choose a chat from the list to start messaging.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white/92 shadow-sm backdrop-blur">
                <div className="text-center">
                  <Empty description="No conversations yet" />
                  <p className="mt-4 text-sm text-slate-500">
                    Message a landlord from any listing to begin.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </DashboardShell>
  );
};

export default StdInbox;
