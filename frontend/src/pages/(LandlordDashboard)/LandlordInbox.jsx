import { useEffect, useRef, useState } from "react";
import { Empty, Spin, notification } from "antd";
import Sidebar from "@/components/landlord_dashboard/Sidebar";
import { DashboardShell } from "@/components/ui/page-shell";
import { useLandlordAuthStore } from "@/store/landlordAuthStore";
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

const LandlordInbox = () => {
  const { landlord, isLandlordAuthenticated } = useLandlordAuthStore();
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
    if (!isLandlordAuthenticated || !landlord) return undefined;

    const nextSocket = connectChatSocket("landlord");

    nextSocket.on("connect", () => {
      nextSocket.emit("update_presence", { status: "online" });
    });

    nextSocket.on("connect_error", () => {
      notification.error({
        message: "Connection error",
        description: "Real-time chat is temporarily unavailable.",
      });
    });

    setSocket(nextSocket);

    return () => {
      clearTimeout(typingTimeoutRef.current);
      nextSocket.disconnect();
      setSocket(null);
    };
  }, [isLandlordAuthenticated, landlord]);

  useEffect(() => {
    if (!isLandlordAuthenticated) return;

    const loadConversations = async () => {
      try {
        setLoading(true);
        const list = await fetchChatConversations("landlord");
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
  }, [isLandlordAuthenticated]);

  useEffect(() => {
    if (!selectedConversation?._id) {
      setMessages([]);
      setIsRecipientTyping(false);
      return;
    }

    const loadMessages = async () => {
      try {
        setMessageLoading(true);
        const nextMessages = await fetchChatMessages(selectedConversation._id, "landlord");
        setMessages(nextMessages);
        await markConversationRead(selectedConversation._id, "landlord");
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
        if (prev.some((item) => item._id === data.message._id)) return prev;
        return [...prev, data.message];
      });

      markConversationRead(selectedConversation._id, "landlord").catch(() => {});
    };

    const handleNewConversation = async () => {
      try {
        const nextConversations = await fetchChatConversations("landlord");
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
          String(message.sender?._id || message.sender) === String(landlord?._id)
            ? { ...message, status: "read" }
            : message
        )
      );
    };

    const handleTyping = (data) => {
      if (
        data.conversationId === selectedConversation?._id &&
        String(data.userId) !== String(landlord?._id)
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
  }, [socket, selectedConversation?._id, landlord?._id]);

  useEffect(() => {
    const unreadTotal = conversations.reduce((total, conversation) => total + (conversation.unreadCount || 0), 0);
    document.title = unreadTotal > 0 ? `(${unreadTotal}) Chats` : "Chats";
  }, [conversations]);

  const handleConversationSelect = async (conversation) => {
    setSelectedConversation(conversation);
    if ((conversation.unreadCount || 0) <= 0) return;

    try {
      await markConversationRead(conversation._id, "landlord");
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
    if (!text || !selectedConversation?._id) return;

    try {
      const response = await sendChatMessage(selectedConversation._id, text, "landlord");
      setMessages((prev) => (prev.some((item) => item._id === response._id) ? prev : [...prev, response]));
      setConversations((prev) =>
        sortConversationsByRecent(
          prev.map((conversation) =>
            conversation._id === selectedConversation._id
              ? { ...conversation, lastMessage: response }
              : conversation
          )
        )
      );
      setMessageText("");
      socket?.emit("typing", { conversationId: selectedConversation._id, isTyping: false });
    } catch {
      notification.error({
        message: "Failed to send",
        description: "Your message could not be sent.",
      });
    }
  };

  if (!isLandlordAuthenticated) {
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
      sidebar={<Sidebar />}
      sidebarWidth="230px"
      eyebrow="Messages"
      title="Inbox"
      description="Keep every student conversation in one focused owner workspace."
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
            description="Keep every student conversation in one place."
            conversations={conversations}
            selectedConversationId={selectedConversation?._id}
            onSelect={handleConversationSelect}
            unreadTotal={unreadTotal}
            emptyDescription="Students will contact you about your listings."
          />

          <section className="min-h-0">
            {selectedConversation ? (
              <ChatWindowPanel
                loading={messageLoading}
                conversation={selectedConversation}
                messages={messages}
                currentUserId={landlord?._id}
                inputValue={messageText}
                onInputChange={handleInputChange}
                onSend={handleSend}
                typingLabel={isRecipientTyping ? `${selectedConversation.recipient?.username || "Student"} is typing...` : ""}
                sendDisabled={!messageText.trim()}
                emptyTitle="No messages yet"
                emptyDescription="Start the conversation with this student."
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
                    Students will contact you about your listings.
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

export default LandlordInbox;
