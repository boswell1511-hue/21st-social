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
    return (data || []).map((row) => row.conversations).filter(Boolean);
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

  async createConversation(createdBy, memberUserIds = []) {
    if (!createdBy) throw new Error("The conversation creator is required.");

    const uniqueMemberIds = [...new Set([createdBy, ...memberUserIds])];

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
      .insert({ conversation_id: conversationId, sender_id: senderId, body: trimmedBody })
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
