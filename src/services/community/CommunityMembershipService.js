import supabase from "../../lib/supabase";

const CommunityMembershipService = {
  async getCurrentUser() {
      const {
            data: { user },
                } = await supabase.auth.getUser();

                    return user;
                      },

                        async isMember(communityId) {
                            const user = await this.getCurrentUser();

                                if (!user) return false;

                                    const { data } = await supabase
                                          .from("community_members")
                                                .select("id")
                                                      .eq("community_id", communityId)
                                                            .eq("user_id", user.id)
                                                                  .maybeSingle();

                                                                      return !!data;
                                                                        },

                                                                          async join(communityId) {
                                                                                const user = await this.getCurrentUser();

                                                                                    if (!user) throw new Error("Please sign in first.");

                                                                                        // Add membership
                                                                                            const { error } = await supabase
                                                                                                    .from("community_members")
                                                                                                            .insert({
                                                                                                                        community_id: communityId,
                                                                                                                                    user_id: user.id,
                                                                                                                                                role: "member",
                                                                                                                                                            status: "joined",
                                                                                                                                                                    });

                                                                                                                                                                        if (error) throw error;

                                                                                                                                                                            // Read current member count
                                                                                                                                                                                const { data: community } = await supabase
                                                                                                                                                                                        .from("communities")
                                                                                                                                                                                                .select("member_count")
                                                                                                                                                                                                        .eq("id", communityId)
                                                                                                                                                                                                                .single();

                                                                                                                                                                                                                    // Increment count
                                                                                                                                                                                                                        await supabase
                                                                                                                                                                                                                                .from("communities")
                                                                                                                                                                                                                                        .update({
                                                                                                                                                                                                                                                    member_count: (community.member_count ?? 0) + 1,
                                                                                                                                                                                                                                                            })
                                                                                                                                                                                                                                                                    .eq("id", communityId);
                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                  

                                                                                                                      async leave(communityId) {
                                                                                                                            const user = await this.getCurrentUser();

                                                                                                                                if (!user) throw new Error("Please sign in first.");

                                                                                                                                    // Remove membership
                                                                                                                                        const { error } = await supabase
                                                                                                                                                .from("community_members")
                                                                                                                                                        .delete()
                                                                                                                                                                .eq("community_id", communityId)
                                                                                                                                                                        .eq("user_id", user.id);

                                                                                                                                                                            if (error) throw error;

                                                                                                                                                                                // Read current member count
                                                                                                                                                                                    const { data: community } = await supabase
                                                                                                                                                                                            .from("communities")
                                                                                                                                                                                                    .select("member_count")
                                                                                                                                                                                                            .eq("id", communityId)
                                                                                                                                                                                                                    .single();

                                                                                                                                                                                                                        // Decrement count (never below zero)
                                                                                                                                                                                                                            await supabase
                                                                                                                                                                                                                                    .from("communities")
                                                                                                                                                                                                                                            .update({
                                                                                                                                                                                                                                                        member_count: Math.max((community.member_count ?? 1) - 1, 0),
                                                                                                                                                                                                                                                                })
                                                                                                                                                                                                                                                                        .eq("id", communityId);
                                                                                                                                                                                                                                                                        },
                                                                                                                      

                                                                                                                                                              async toggle(communityId) {
                                                                                                                                                                  const joined = await this.isMember(communityId);

                                                                                                                                                                    if (joined) {
                                                                                                                                                                        return this.leave(communityId);
                                                                                                                                                                          }

                                                                                                                                                                            return this.join(communityId);
                                                                                                                                                                            },
                                                                                                                                                              }
                                                                                                                                                              

                                                                                                                                                                                      export default CommunityMembershipService;