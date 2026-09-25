import { useEffect, useState } from "react";
import supabase from "../../lib/supabase";
import MessagingService from "../../services/messaging/MessagingService";

function Messages({ onBack }) {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageBody, setMessageBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [showNewConversation, setShowNewConversation] = useState(false);
  const [profileSearch, setProfileSearch] = useState("");
  const [profileResults, setProfileResults] = useState([]);
  const [searchingProfiles, setSearchingProfiles] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [creatingConversation, setCreatingConversation] = useState(false);

  useEffect(() => {
    loadMessagingData();
  }, []);

  async function loadMessagingData() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!currentUser) {
        setError("You must be signed in to view messages.");
        return;
      }

      setUser(currentUser);
      const conversationData = await MessagingService.listConversations(
        currentUser.id
      );
      setConversations(conversationData);
    } catch (loadError) {
      console.error("Unable to load messages:", loadError);
      setError(loadError.message || "Unable to load messages.");
    } finally {
      setLoading(false);
    }
  }

  async function searchProfiles(event) {
    const value = event.target.value;
    setProfileSearch(value);
    setSelectedProfile(null);

    if (value.trim().length < 2) {
      setProfileResults([]);
      return;
    }

    setSearchingProfiles(true);
    setError("");

    try {
      const results = await MessagingService.searchProfilesForMessaging(value);
      setProfileResults(results);
    } catch (searchError) {
      console.error("Unable to search profiles:", searchError);
      setError(searchError.message || "Unable to search profiles.");
    } finally {
      setSearchingProfiles(false);
    }
  }

  async function handleCreateConversation() {
    if (!user || !selectedProfile || creatingConversation) return;

    setCreatingConversation(true);
    setError("");

    try {
      const newConversation = await MessagingService.createConversation(
        user.id,
        [selectedProfile.id]
      );

      const namedConversation = {
        ...newConversation,
        participant: selectedProfile,
        displayName:
          selectedProfile.display_name ||
          selectedProfile.username ||
          "Conversation",
      };

      setConversations((currentConversations) => [
        namedConversation,
        ...currentConversations.filter(
          (conversation) => conversation.id !== namedConversation.id
        ),
      ]);

      setShowNewConversation(false);
      setProfileSearch("");
      setProfileResults([]);
      setSelectedProfile(null);

      await openConversation(namedConversation);
    } catch (createError) {
      console.error("Unable to create conversation:", createError);
      setError(
        createError.message || "Unable to create the conversation."
      );
    } finally {
      setCreatingConversation(false);
    }
  }

  async function openConversation(conversation) {
    setSelectedConversation(conversation);
    setLoadingMessages(true);
    setError("");

    try {
      const conversationMessages = await MessagingService.getMessages(
        conversation.id
      );
      setMessages(conversationMessages);
    } catch (loadError) {
      console.error("Unable to load conversation:", loadError);
      setError(loadError.message || "Unable to load conversation.");
    } finally {
      setLoadingMessages(false);
    }
  }

  async function handleSendMessage(event) {
    event.preventDefault();

    const trimmedBody = messageBody.trim();

    if (!trimmedBody || !selectedConversation || !user || sending) {
      return;
    }

    setSending(true);
    setError("");

    try {
      const newMessage = await MessagingService.sendMessage(
        selectedConversation.id,
        user.id,
        trimmedBody
      );

      setMessages((currentMessages) => [...currentMessages, newMessage]);
      setMessageBody("");
    } catch (sendError) {
      console.error("Unable to send message:", sendError);
      setError(sendError.message || "Unable to send message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b0b12",
        color: "#ffffff",
        padding: "20px",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            background: "transparent",
            color: "#ffffff",
            border: "1px solid #444",
            borderRadius: "8px",
            padding: "8px 12px",
          }}
        >
          Back
        </button>

        <h1 style={{ margin: 0 }}>Messages</h1>

        <button
          type="button"
          onClick={() => setShowNewConversation((current) => !current)}
          style={{
            marginLeft: "auto",
            background: "#7652d9",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            padding: "9px 12px",
          }}
        >
          {showNewConversation ? "Cancel" : "New Message"}
        </button>
      </header>

      {error && (
        <p
          style={{
            background: "#3b1720",
            color: "#ffb4c0",
            padding: "12px",
            borderRadius: "8px",
          }}
        >
          {error}
        </p>
      )}

      {showNewConversation && (
        <section
          style={{
            border: "1px solid #292938",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "20px",
          }}
        >
          <h2>Start a new conversation</h2>

          <input
            value={profileSearch}
            onChange={searchProfiles}
            placeholder="Search by username or display name..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "#11111b",
              color: "#ffffff",
              border: "1px solid #444",
              borderRadius: "8px",
              padding: "12px",
            }}
          />

          {searchingProfiles && <p>Searching...</p>}

          {!searchingProfiles && profileSearch.trim().length >= 2 &&
            profileResults.length === 0 && (
              <p style={{ color: "#aaa" }}>No matching users found.</p>
            )}

          <div style={{ marginTop: "12px" }}>
            {profileResults.map((profile) => (
              <button
                key={profile.id}
                type="button"
                onClick={() => setSelectedProfile(profile)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  background:
                    selectedProfile?.id === profile.id
                      ? "#29204a"
                      : "#171722",
                  color: "#ffffff",
                  border: "1px solid #343447",
                  borderRadius: "8px",
                  padding: "12px",
                  marginBottom: "8px",
                }}
              >
                <strong>
                  {profile.username || profile.display_name || "User"}
                </strong>
                {profile.username && profile.display_name && (
                  <div style={{ color: "#aaa", marginTop: "4px" }}>
                    {profile.display_name}
                  </div>
                )}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={!selectedProfile || creatingConversation}
            onClick={handleCreateConversation}
            style={{
              background: "#7652d9",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "10px 16px",
              opacity: !selectedProfile || creatingConversation ? 0.5 : 1,
            }}
          >
            {creatingConversation ? "Creating..." : "Start Conversation"}
          </button>
        </section>
      )}

      {loading ? (
        <p>Loading conversations...</p>
      ) : conversations.length === 0 ? (
        <section
          style={{
            border: "1px solid #292938",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <h2>No conversations yet</h2>
          <p style={{ color: "#aaa" }}>
            Use New Message to start a conversation.
          </p>
        </section>
      ) : (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr)",
            gap: "16px",
          }}
        >
          <div>
            <h2>Conversations</h2>

            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => openConversation(conversation)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  background:
                    selectedConversation?.id === conversation.id
                      ? "#29204a"
                      : "#171722",
                  color: "#ffffff",
                  border: "1px solid #343447",
                  borderRadius: "10px",
                  padding: "14px",
                  marginBottom: "8px",
                }}
              >
                <strong>
                  {conversation.participant?.username ||
                    conversation.displayName ||
                    "Conversation"}
                </strong>
                {conversation.participant?.display_name && (
                  <div
                    style={{
                      color: "#aaa",
                      fontSize: "12px",
                      marginTop: "4px",
                    }}
                  >
                    {conversation.participant.display_name}
                  </div>
                )}
              </button>
            ))}
          </div>

          {selectedConversation && (
            <div
              style={{
                border: "1px solid #292938",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <h2 style={{ marginBottom: "4px" }}>
                {selectedConversation.participant?.username ||
                  selectedConversation.displayName ||
                  "Conversation"}
              </h2>
              {selectedConversation.participant?.display_name && (
                <div style={{ color: "#aaa", marginBottom: "16px" }}>
                  {selectedConversation.participant.display_name}
                </div>
              )}

              {loadingMessages ? (
                <p>Loading messages...</p>
              ) : messages.length === 0 ? (
                <p style={{ color: "#aaa" }}>
                  No messages in this conversation yet.
                </p>
              ) : (
                <div style={{ marginBottom: "20px" }}>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      style={{
                        background:
                          message.sender_id === user?.id
                            ? "#29204a"
                            : "#20202c",
                        borderRadius: "10px",
                        padding: "10px 12px",
                        marginBottom: "8px",
                      }}
                    >
                      <p style={{ margin: 0 }}>{message.body}</p>
                      <small style={{ color: "#aaa" }}>
                        {new Date(message.created_at).toLocaleString()}
                      </small>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSendMessage}>
                <textarea
                  value={messageBody}
                  onChange={(event) => setMessageBody(event.target.value)}
                  placeholder="Write a message..."
                  rows={3}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    resize: "vertical",
                    background: "#11111b",
                    color: "#ffffff",
                    border: "1px solid #444",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "8px",
                  }}
                />

                <button
                  type="submit"
                  disabled={sending || !messageBody.trim()}
                  style={{
                    background: "#7652d9",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 18px",
                    opacity: sending || !messageBody.trim() ? 0.5 : 1,
                  }}
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </form>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default Messages;
