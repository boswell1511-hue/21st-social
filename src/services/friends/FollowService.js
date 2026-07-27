import supabase from "../../lib/supabase";

const FollowService = {
  async getCurrentUser() {
      const {
            data: { user },
                  error,
                      } = await supabase.auth.getUser();

                          if (error) throw error;

                              return user;
                                },

                                  async isFollowing(userId) {
                                      const user = await this.getCurrentUser();

                                          if (!user) return false;

                                              const { data, error } = await supabase
                                                    .from("follows")
                                                          .select("id")
                                                                .eq("follower_id", user.id)
                                                                      .eq("following_id", userId)
                                                                            .maybeSingle();

                                                                                if (error) throw error;

                                                                                    return !!data;
                                                                                      },

                                                                                        async follow(userId) {
                                                                                            const user = await this.getCurrentUser();

                                                                                                if (!user) throw new Error("No authenticated user.");

                                                                                                    const { error } = await supabase
                                                                                                          .from("follows")
                                                                                                                .insert({
                                                                                                                        follower_id: user.id,
                                                                                                                                following_id: userId,
                                                                                                                                      });

                                                                                                                                          if (error) throw error;
                                                                                                                                            },

                                                                                                                                              async unfollow(userId) {
                                                                                                                                                  const user = await this.getCurrentUser();

                                                                                                                                                      if (!user) throw new Error("No authenticated user.");

                                                                                                                                                          const { error } = await supabase
                                                                                                                                                                .from("follows")
                                                                                                                                                                      .delete()
                                                                                                                                                                            .eq("follower_id", user.id)
                                                                                                                                                                                  .eq("following_id", userId);

                                                                                                                                                                                      if (error) throw error;
                                                                                                                                                                                        },

                                                                                                                                                                                          async getFollowerCount(userId) {
                                                                                                                                                                                              const { count, error } = await supabase
                                                                                                                                                                                                    .from("follows")
                                                                                                                                                                                                          .select("*", { count: "exact", head: true })
                                                                                                                                                                                                                .eq("following_id", userId);

                                                                                                                                                                                                                    if (error) throw error;

                                                                                                                                                                                                                        return count || 0;
                                                                                                                                                                                                                          },

                                                                                                                                                                                                                            async getFollowingCount(userId) {
                                                                                                                                                                                                                                const { count, error } = await supabase
                                                                                                                                                                                                                                      .from("follows")
                                                                                                                                                                                                                                            .select("*", { count: "exact", head: true })
                                                                                                                                                                                                                                                  .eq("follower_id", userId);

                                                                                                                                                                                                                                                      if (error) throw error;

                                                                                                                                                                                                                                                          return count || 0;
                                                                                                                                                                                                                                                            },
                                                                                                                                                                                                                                                            };

                                                                                                                                                                                                                                                            export default FollowService;