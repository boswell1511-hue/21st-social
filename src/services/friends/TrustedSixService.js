import supabase from "../../lib/supabase";

const TrustedSixService = {
  async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) throw error;

    return user;
  },

  async getTrustedSix(userId = null) {
    const targetUserId = userId || (await this.getCurrentUser())?.id;

    if (!targetUserId) return [];

    const { data, error } = await supabase
      .from("trusted_six")
      .select("id, trusted_user_id, position, created_at")
      .eq("user_id", targetUserId)
      .order("position", { ascending: true });

    if (error) throw error;

    return data || [];
  },

  async addTrustedUser(trustedUserId, position) {
    const user = await this.getCurrentUser();

    if (!user) throw new Error("No authenticated user.");

    if (!trustedUserId) throw new Error("A trusted user is required.");

    if (trustedUserId === user.id) {
      throw new Error("You cannot add yourself to Trusted 6.");
    }

    if (!Number.isInteger(position) || position < 1 || position > 6) {
      throw new Error("Trusted 6 position must be between 1 and 6.");
    }

    const current = await this.getTrustedSix(user.id);

    if (current.some((item) => item.trusted_user_id === trustedUserId)) {
      throw new Error("This user is already in your Trusted 6.");
    }

    if (current.length >= 6) {
      throw new Error("Trusted 6 can contain up to six people.");
    }

    if (current.some((item) => item.position === position)) {
      throw new Error("That Trusted 6 position is already in use.");
    }

    const { data, error } = await supabase
      .from("trusted_six")
      .insert({
        user_id: user.id,
        trusted_user_id: trustedUserId,
        position,
      })
      .select("id, trusted_user_id, position, created_at")
      .single();

    if (error) throw error;

    return data;
  },

  async removeTrustedUser(trustedUserId) {
    const user = await this.getCurrentUser();

    if (!user) throw new Error("No authenticated user.");

    if (!trustedUserId) return;

    const { error } = await supabase
      .from("trusted_six")
      .delete()
      .eq("user_id", user.id)
      .eq("trusted_user_id", trustedUserId);

    if (error) throw error;
  },
};

export default TrustedSixService;
