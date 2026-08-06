import supabase from "../../lib/supabase";

const CommunityService = {
  async getCurrentUser() {
      const {
            data: { user },
                } = await supabase.auth.getUser();

                    return user;
                      },

                        async createCommunity({
                            name,
                                description,
                                    icon,
                                          }) {
                                              const user = await this.getCurrentUser();

                                                  if (!user) {
                                                        throw new Error("Please sign in first.");
                                                            }

                                                                const { data, error } = await supabase
                                                                      .from("communities")
                                                                                 .insert({
                                                                                        name,
                                                                                            description,
                                                                                                icon,
                                                                                                    owner_id: user.id,
                                                                                                          })                                                                                 
                                                                                                                                    .select()
                                                                                                                                              .single();

                                                                                                                                                  if (error) {
                                                                                                                                                        throw error;
                                                                                                                                                            }
                                                                                                                                                            await supabase
                                                                                                                                                              .from("community_members")
                                                                                                                                                                .insert({
                                                                                                                                                                    community_id: data.id,
                                                                                                                                                                        user_id: user.id,
                                                                                                                                                                            role: "owner",
                                                                                                                                                                                status: "joined",
                                                                                                                                                                                  });
                                                                                                                                                                                
                                                                                                                                                                                  await supabase
                                                                                                                                                                                    .from("communities")
                                                                                                                                                                                      .update({
                                                                                                                                                                                          member_count: 1,
                                                                                                                                                                                            })
                                                                                                                                                                                              .eq("id", data.id);
                                                                                                                                                                return data;
                                                                                                                                                                  },
                                                                                                                                                                  };

                                                                                                                                                                  export default CommunityService;