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

    if (conversations.length === 0) {
      return [];
    }

    const conversationIds = conversations.map((conversation) => conversation.id);

    const { data: memberRows, error: membersError } = await supabase
      .from("conversation_members")
      .select("conversation_id, user_id")
      .in("conversation_id", conversationIds);

    if (membersError) throw membersError;

    const memberUserIds = [
      ...new Set((memberRows || []).map((member) => member.user_id).filter(Boolean)),
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
      const participant = otherParticipants[0] || participantProfiles[0] || null;

      return {
        ...conversation,
        participantProfiles,
        participant,
        displayName:
          participant?.display_name ||
          participant?.username ||
          (otherParticipants.length > 1
            ? `${otherParticipants.length} participants`
            : "Conversation"),
      };
    });
  },

  async getConversationMembers(conversationId) {
    if (!conversationId) throw new Error("A conversation ID is required.");

    const { data, error } = await supabase
      .from("conversation_members")
      .select("id, conversation_id, user_id, joined_at")
      .eq("conversation_id", conversationId)
      .order("joined_at", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getMessages(conversationId) {
    if (!conversationId) throw new Error("A conversation ID is required.");

    const { data, error } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, body, created_at, read_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async searchProfilesForMessaging(searchText) {
    const trimmedSearch = searchText?.trim();

    if (!trimmedSearch || trimmedSearch.length < 2) {
      return [];
    }

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

    if (!conversationId) {
      return null;
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .select("id, created_by, created_at, updated_at")
      .eq("id", conversationId)
      .single();

    if (conversationError) throw conversationError;

    return conversation;
  },

  async createConversation(createdBy, memberUserIds = []) {
    if (!createdBy) {
      throw new Error("The conversation creator is required.");
    }

    const uniqueMemberIds = [
      ...new Set([createdBy, ...memberUserIds].filter(Boolean)),
    ];

    const otherMemberIds = uniqueMemberIds.filter(
      (userId) => userId !== createdBy
    );

    // A conversation with exactly one other member is a direct conversation.
    // Reuse the existing conversation instead of creating a duplicate.
    if (otherMemberIds.length === 1) {
      const existingConversation = await this.findDirectConversation(
        otherMemberIds[0]
      );

      if (existingConversation) {
        return existingConversation;
      }
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({ created_by: createdBy })
      .select("id, created_by, created_at, updated_at")
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

  async sendMessage(conversationId, senderId, body) {
    const trimmedBody = body?.trim();

    if (!conversationId) throw new Error("A conversation ID is required.");
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
    return data;
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
