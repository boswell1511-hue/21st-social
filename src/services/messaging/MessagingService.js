import supabase from "../../lib/supabase";

const MessagingService = {
  async listConversations(userId) {
    if (!userId) throw new Error("A user ID is required.");

    const { data, error } = await supabase
      .from("conversation_members")
      .select(`
        conversation_id,
        joined_at,
        conversations (
          id,
          created_by,
          conversation_type,
          name,
          is_locked,
          created_at,
          updated_at
        )
      `)
      .eq("user_id", userId)
      .order("joined_at", { ascending: false });

    if (error) throw error;

    const conversations = (data || [])
      .map((row) => row.conversations)
      .filter(Boolean);

    if (conversations.length === 0) return [];

    const conversationIds = conversations.map((conversation) => conversation.id);

    const { data: memberRows, error: membersError } = await supabase
      .from("conversation_members")
      .select("conversation_id, user_id, joined_at")
      .in("conversation_id", conversationIds);

    if (membersError) throw membersError;

    const memberUserIds = [
      ...new Set(
        (memberRows || [])
          .map((member) => member.user_id)
          .filter(Boolean)
      ),
    ];

    let profiles = [];

    if (memberUserIds.length > 0) {
      const { data: profileRows, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", memberUserIds);

      if (profilesError) throw profilesError;
      profiles = profileRows || [];
    }

    const profilesById = new Map(
      profiles.map((profile) => [profile.id, profile])
    );

    const membersByConversationId = new Map();

    (memberRows || []).forEach((member) => {
      const existingMembers =
        membersByConversationId.get(member.conversation_id) || [];

      const profile = profilesById.get(member.user_id);

      if (profile) {
        existingMembers.push(profile);
      }

      membersByConversationId.set(member.conversation_id, existingMembers);
    });

    return conversations.map((conversation) => {
      const participantProfiles =
        membersByConversationId.get(conversation.id) || [];

      const otherParticipants = participantProfiles.filter(
        (profile) => profile.id !== userId
      );

      const participant =
        otherParticipants[0] || participantProfiles[0] || null;

      const isGroup = conversation.conversation_type === "group";

      return {
        ...conversation,
        participantProfiles,
        participant,
        displayName: isGroup
          ? conversation.name || "Group Conversation"
          : participant?.display_name ||
            participant?.username ||
            (otherParticipants.length > 1
              ? `${otherParticipants.length} participants`
              : "Conversation"),
      };
    });
  },

  async getConversationMembers(conversationId) {
    if (!conversationId) {
      throw new Error("A conversation ID is required.");
    }

    const { data: memberRows, error: membersError } = await supabase
      .from("conversation_members")
      .select("id, conversation_id, user_id, joined_at")
      .eq("conversation_id", conversationId)
      .order("joined_at", { ascending: true });

    if (membersError) throw membersError;

    const memberUserIds = [
      ...new Set(
        (memberRows || [])
          .map((member) => member.user_id)
          .filter(Boolean)
      ),
    ];

    let profiles = [];

    if (memberUserIds.length > 0) {
      const { data: profileRows, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", memberUserIds);

      if (profilesError) throw profilesError;
      profiles = profileRows || [];
    }

    const profilesById = new Map(
      profiles.map((profile) => [profile.id, profile])
    );

    return (memberRows || []).map((member) => ({
      ...member,
      profile: profilesById.get(member.user_id) || null,
    }));
  },

  async getMessages(conversationId) {
    if (!conversationId) {
      throw new Error("A conversation ID is required.");
    }

    const { data: messageRows, error } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, body, created_at, read_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const senderIds = [
      ...new Set(
        (messageRows || [])
          .map((message) => message.sender_id)
          .filter(Boolean)
      ),
    ];

    let profiles = [];

    if (senderIds.length > 0) {
      const { data: profileRows, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", senderIds);

      if (profilesError) throw profilesError;
      profiles = profileRows || [];
    }

    const profilesById = new Map(
      profiles.map((profile) => [profile.id, profile])
    );

    return (messageRows || []).map((message) => ({
      ...message,
      senderProfile: profilesById.get(message.sender_id) || null,
    }));
  },

  async searchProfilesForMessaging(searchText) {
    const trimmedSearch = searchText?.trim();

    if (!trimmedSearch || trimmedSearch.length < 2) return [];

    const { data, error } = await supabase.rpc(
      "search_profiles_for_messaging",
      { p_search: trimmedSearch }
    );

    if (error) throw error;
    return data || [];
  },

  async findDirectConversation(otherUserId) {
    if (!otherUserId) {
      throw new Error("The other user ID is required.");
    }

    const { data: matches, error: findError } = await supabase.rpc(
      "find_direct_conversation",
      { p_other_user_id: otherUserId }
    );

    if (findError) throw findError;

    const conversationId = matches?.[0]?.conversation_id;

    if (!conversationId) return null;

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .select(
        "id, created_by, conversation_type, name, is_locked, created_at, updated_at"
      )
      .eq("id", conversationId)
      .single();

    if (conversationError) throw conversationError;

    return conversation;
  },

  async createConversation(
    createdBy,
    memberUserIds = [],
    options = {}
  ) {
    if (!createdBy) {
      throw new Error("The conversation creator is required.");
    }

    const conversationType =
      options.conversationType === "group" ? "group" : "direct";

    const groupName = options.name?.trim() || "";

    if (conversationType === "group" && !groupName) {
      throw new Error("A group name is required.");
    }

    const uniqueMemberIds = [
      ...new Set([createdBy, ...memberUserIds].filter(Boolean)),
    ];

    const otherMemberIds = uniqueMemberIds.filter(
      (userId) => userId !== createdBy
    );

    if (conversationType === "direct") {
      if (otherMemberIds.length !== 1) {
        throw new Error(
          "A direct conversation requires exactly one other member."
        );
      }

      const existingConversation = await this.findDirectConversation(
        otherMemberIds[0]
      );

      if (existingConversation) {
        return existingConversation;
      }
    }

    if (conversationType === "group" && otherMemberIds.length < 2) {
      throw new Error("A group conversation requires at least two other members.");
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({
        created_by: createdBy,
        conversation_type: conversationType,
        name: conversationType === "group" ? groupName : null,
        is_locked: false,
      })
      .select(
        "id, created_by, conversation_type, name, is_locked, created_at, updated_at"
      )
      .single();

    if (conversationError) throw conversationError;

    const memberships = uniqueMemberIds.map((userId) => ({
      conversation_id: conversation.id,
      user_id: userId,
    }));

    const { error: membersError } = await supabase
      .from("conversation_members")
      .insert(memberships);

    if (membersError) throw membersError;

    return conversation;
  },

  async updateGroupConversationName(conversationId, name) {
    if (!conversationId) {
      throw new Error("A conversation ID is required.");
    }

    const trimmedName = name?.trim();

    if (!trimmedName) {
      throw new Error("Group name cannot be empty.");
    }

    const { data, error } = await supabase.rpc(
      "update_group_conversation_name",
      {
        p_conversation_id: conversationId,
        p_name: trimmedName,
      }
    );

    if (error) throw error;

    return Array.isArray(data) ? data[0] : data;
  },

  async sendMessage(conversationId, senderId, body) {
    const trimmedBody = body?.trim();

    if (!conversationId) {
      throw new Error("A conversation ID is required.");
    }

    if (!senderId) throw new Error("A sender ID is required.");
    if (!trimmedBody) throw new Error("Message text cannot be empty.");

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        body: trimmedBody,
      })
      .select("id, conversation_id, sender_id, body, created_at, read_at")
      .single();

    if (error) throw error;

    const { data: senderProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .eq("id", senderId)
      .single();

    if (profileError) throw profileError;

    return {
      ...data,
      senderProfile,
    };
  },

  async markMessageRead(messageId) {
    if (!messageId) throw new Error("A message ID is required.");

    const { data, error } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", messageId)
      .select("id, conversation_id, sender_id, body, created_at, read_at")
      .single();

    if (error) throw error;
    return data;
  },
};

export default MessagingService;
