import { useEffect, useState } from "react";
import supabase from "../../lib/supabase";
import MessagingService from "../../services/messaging/MessagingService";

function Messages({ onBack }) {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationMembers, setConversationMembers] = useState([]);
  const [messageBody, setMessageBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [showNewConversation, setShowNewConversation] = useState(false);
  const [conversationMode, setConversationMode] = useState("direct");
  const [groupName, setGroupName] = useState("");
  const [profileSearch, setProfileSearch] = useState("");
  const [profileResults, setProfileResults] = useState([]);
  const [searchingProfiles, setSearchingProfiles] = useState(false);
  const [selectedProfiles, setSelectedProfiles] = useState([]);
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

  function resetNewConversation() {
    setProfileSearch("");
    setProfileResults([]);
    setSelectedProfiles([]);
    setGroupName("");
    setConversationMode("direct");
  }

  function closeNewConversation() {
    setShowNewConversation(false);
    resetNewConversation();
  }

  function changeConversationMode(mode) {
    setConversationMode(mode);
    setSelectedProfiles([]);
    setProfileSearch("");
    setProfileResults([]);
  }

  async function searchProfiles(event) {
    const value = event.target.value;
    setProfileSearch(value);

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

  function toggleProfileSelection(profile) {
    if (conversationMode === "direct") {
      setSelectedProfiles([profile]);
      return;
    }

    setSelectedProfiles((currentProfiles) => {
      const alreadySelected = currentProfiles.some(
        (selected) => selected.id === profile.id
      );

      if (alreadySelected) {
        return currentProfiles.filter((selected) => selected.id !== profile.id);
      }

      return [...currentProfiles, profile];
    });
  }

  function removeSelectedProfile(profileId) {
    setSelectedProfiles((currentProfiles) =>
      currentProfiles.filter((profile) => profile.id !== profileId)
    );
  }

  async function handleCreateConversation() {
    if (!user || creatingConversation) return;

    if (conversationMode === "direct" && selectedProfiles.length !== 1) {
      setError("Select one person for a direct message.");
      return;
    }

    if (conversationMode === "group") {
      if (!groupName.trim()) {
        setError("Enter a name for the group.");
        return;
      }

      if (selectedProfiles.length < 2) {
        setError("Select at least two other members for a group.");
        return;
      }
    }

    setCreatingConversation(true);
    setError("");

    try {
      const newConversation = await MessagingService.createConversation(
        user.id,
        selectedProfiles.map((profile) => profile.id),
        {
          conversationType: conversationMode,
          name: groupName,
        }
      );

      const namedConversation = {
        ...newConversation,
        participantProfiles: [user, ...selectedProfiles],
        participant: selectedProfiles[0] || user,
        displayName:
          conversationMode === "group"
            ? newConversation.name || groupName.trim()
            : selectedProfiles[0]?.display_name ||
              selectedProfiles[0]?.username ||
              "Conversation",
      };

      setConversations((currentConversations) => [
        namedConversation,
        ...currentConversations.filter(
          (conversation) => conversation.id !== namedConversation.id
        ),
      ]);

      closeNewConversation();
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
    setMessages([]);
    setConversationMembers([]);
    setLoadingMessages(true);
    setError("");

    try {
      const [conversationMessages, members] = await Promise.all([
        MessagingService.getMessages(conversation.id),
        MessagingService.getConversationMembers(conversation.id),
      ]);

      setMessages(conversationMessages);
      setConversationMembers(members);
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

  function getProfileName(profile, fallback = "Unknown user") {
    return (
      profile?.display_name ||
      profile?.username ||
      fallback
    );
  }

  function getProfileUsername(profile) {
    return profile?.username ? `@${profile.username}` : "";
  }

  const isSelectedGroup =
    selectedConversation?.conversation_type === "group";

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
          onClick={() => {
            if (showNewConversation) {
              closeNewConversation();
            } else {
              setShowNewConversation(true);
            }
          }}
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
          <h2 style={{ marginTop: 0 }}>Start a new conversation</h2>

          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <button
              type="button"
              onClick={() => changeConversationMode("direct")}
              style={{
                background:
                  conversationMode === "direct" ? "#29204a" : "#171722",
                color: "#ffffff",
                border: "1px solid #343447",
                borderRadius: "8px",
                padding: "9px 12px",
              }}
            >
              Direct Message
            </button>

            <button
              type="button"
              onClick={() => changeConversationMode("group")}
              style={{
                background:
                  conversationMode === "group" ? "#29204a" : "#171722",
                color: "#ffffff",
                border: "1px solid #343447",
                borderRadius: "8px",
                padding: "9px 12px",
              }}
            >
              Group Message
            </button>
          </div>

          {conversationMode === "group" && (
            <input
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="Group name..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "#11111b",
                color: "#ffffff",
                border: "1px solid #444",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "10px",
              }}
            />
          )}

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

          {selectedProfiles.length > 0 && (
            <div style={{ marginTop: "12px" }}>
              <div style={{ color: "#aaa", marginBottom: "8px" }}>
                Selected members: {selectedProfiles.length}
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {selectedProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => removeSelectedProfile(profile.id)}
                    style={{
                      background: "#29204a",
                      color: "#ffffff",
                      border: "1px solid #7652d9",
                      borderRadius: "16px",
                      padding: "6px 10px",
                    }}
                  >
                    {getProfileName(profile)} ×
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchingProfiles && <p>Searching...</p>}

          {!searchingProfiles &&
            profileSearch.trim().length >= 2 &&
            profileResults.length === 0 && (
              <p style={{ color: "#aaa" }}>No matching users found.</p>
            )}

          <div style={{ marginTop: "12px" }}>
            {profileResults.map((profile) => {
              const isSelected = selectedProfiles.some(
                (selected) => selected.id === profile.id
              );

              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => toggleProfileSelection(profile)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    background: isSelected ? "#29204a" : "#171722",
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
              );
            })}
          </div>

          <button
            type="button"
            disabled={
              creatingConversation ||
              (conversationMode === "direct"
                ? selectedProfiles.length !== 1
                : !groupName.trim() || selectedProfiles.length < 2)
            }
            onClick={handleCreateConversation}
            style={{
              background: "#7652d9",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "10px 16px",
              opacity:
                creatingConversation ||
                (conversationMode === "direct"
                  ? selectedProfiles.length !== 1
                  : !groupName.trim() || selectedProfiles.length < 2)
                  ? 0.5
                  : 1,
            }}
          >
            {creatingConversation
              ? "Creating..."
              : conversationMode === "group"
                ? "Create Group"
                : "Start Conversation"}
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

            {conversations.map((conversation) => {
              const isGroup =
                conversation.conversation_type === "group";

              return (
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
                    {isGroup
                      ? conversation.name || "Group Conversation"
                      : conversation.participant?.username ||
                        conversation.displayName ||
                        "Conversation"}
                  </strong>

                  {isGroup ? (
                    <div
                      style={{
                        color: "#aaa",
                        fontSize: "12px",
                        marginTop: "4px",
                      }}
                    >
                      {conversation.participantProfiles?.length || 0} members
                    </div>
                  ) : (
                    conversation.participant?.display_name && (
                      <div
                        style={{
                          color: "#aaa",
                          fontSize: "12px",
                          marginTop: "4px",
                        }}
                      >
                        {conversation.participant.display_name}
                      </div>
                    )
                  )}
                </button>
              );
            })}
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
                {isSelectedGroup
                  ? selectedConversation.name || "Group Conversation"
                  : selectedConversation.participant?.username ||
                    selectedConversation.displayName ||
                    "Conversation"}
              </h2>

              {isSelectedGroup ? (
                <section
                  style={{
                    border: "1px solid #292938",
                    borderRadius: "10px",
                    padding: "12px",
                    marginBottom: "16px",
                  }}
                >
                  <h3 style={{ marginTop: 0, marginBottom: "10px" }}>
                    Group members ({conversationMembers.length})
                  </h3>

                  {conversationMembers.map((member) => {
                    const profile = member.profile;
                    const isCurrentUser = member.user_id === user?.id;

                    return (
                      <div
                        key={member.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "8px 0",
                          borderBottom: "1px solid #20202c",
                        }}
                      >
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt=""
                            width="32"
                            height="32"
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: "#29204a",
                            }}
                          />
                        )}

                        <div>
                          <strong>
                            {getProfileName(profile)}
                            {isCurrentUser ? " (You)" : ""}
                          </strong>
                          {getProfileUsername(profile) && (
                            <div style={{ color: "#aaa", fontSize: "12px" }}>
                              {getProfileUsername(profile)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </section>
              ) : (
                selectedConversation.participant?.display_name && (
                  <div style={{ color: "#aaa", marginBottom: "16px" }}>
                    {selectedConversation.participant.display_name}
                  </div>
                )
              )}

              {loadingMessages ? (
                <p>Loading messages...</p>
              ) : messages.length === 0 ? (
                <p style={{ color: "#aaa" }}>
                  No messages in this conversation yet.
                </p>
              ) : (
                <div style={{ marginBottom: "20px" }}>
                  {messages.map((message) => {
                    const senderProfile =
                      message.senderProfile ||
                      conversationMembers.find(
                        (member) => member.user_id === message.sender_id
                      )?.profile ||
                      null;

                    const senderName = getProfileName(
                      senderProfile,
                      message.sender_id === user?.id ? "You" : "Unknown user"
                    );

                    return (
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
                        <div
                          style={{
                            fontWeight: "700",
                            color: "#bda7ff",
                            marginBottom: "4px",
                          }}
                        >
                          {senderName}
                        </div>

                        <p style={{ margin: 0 }}>{message.body}</p>

                        <small style={{ color: "#aaa" }}>
                          {new Date(message.created_at).toLocaleString()}
                        </small>
                      </div>
                    );
                  })}
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
