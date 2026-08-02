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

                                                                                  return supabase
                                                                                      .from("community_members")
                                                                                          .insert({
                                                                                                community_id: communityId,
                                                                                                      user_id: user.id,
                                                                                                            role: "member",
                                                                                                                  status: "joined",
                                                                                                                      })
                                                                                                                          .select();
                                                                                                                          },
                                                                          
                                                                                                                                

                                                                                                                      async leave(communityId) {
                                                                                                                          const user = await this.getCurrentUser();

                                                                                                                              if (!user) throw new Error("Please sign in first.");

                                                                                                                                  return supabase
                                                                                                                                        .from("community_members")
                                                                                                                                              .delete()
                                                                                                                                                    .eq("community_id", communityId)
                                                                                                                                                          .eq("user_id", user.id);
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