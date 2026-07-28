import supabase from "../../lib/supabase";

const LikeService = {
  async getCurrentUser() {
      const {
            data: { user },
                  error,
                      } = await supabase.auth.getUser();

                          if (error) throw error;

                              return user;
                                },

                                  async likePost(postId) {
                                      const user = await this.getCurrentUser();

                                          if (!user) {
                                                throw new Error("No authenticated user.");
                                                    }

                                                        const { error } = await supabase
                                                              .from("likes")
                                                                    .insert({
                                                                            user_id: user.id,
                                                                                    post_id: postId,
                                                                                          });

                                                                                              if (error) throw error;

                                                                                                  return true;
                                                                                                    },

                                                                                                      async unlikePost(postId) {
                                                                                                          const user = await this.getCurrentUser();

                                                                                                              if (!user) {
                                                                                                                    throw new Error("No authenticated user.");
                                                                                                                        }

                                                                                                                            const { error } = await supabase
                                                                                                                                  .from("likes")
                                                                                                                                        .delete()
                                                                                                                                              .eq("user_id", user.id)
                                                                                                                                                    .eq("post_id", postId);

                                                                                                                                                        if (error) throw error;

                                                                                                                                                            return true;
                                                                                                                                                              },

                                                                                                                                                                async isLiked(postId) {
                                                                                                                                                                    const user = await this.getCurrentUser();

                                                                                                                                                                        if (!user) return false;

                                                                                                                                                                            const { data, error } = await supabase
                                                                                                                                                                                  .from("likes")
                                                                                                                                                                                        .select("id")
                                                                                                                                                                                              .eq("user_id", user.id)
                                                                                                                                                                                                    .eq("post_id", postId)
                                                                                                                                                                                                          .maybeSingle();

                                                                                                                                                                                                              if (error) throw error;

                                                                                                                                                                                                                  return !!data;
                                                                                                                                                                                                                    },

                                                                                                                                                                                                                      async getLikeCount(postId) {
                                                                                                                                                                                                                          const { count, error } = await supabase
                                                                                                                                                                                                                                .from("likes")
                                                                                                                                                                                                                                      .select("*", {
                                                                                                                                                                                                                                              count: "exact",
                                                                                                                                                                                                                                                      head: true,
                                                                                                                                                                                                                                                            })
                                                                                                                                                                                                                                                                  .eq("post_id", postId);

                                                                                                                                                                                                                                                                      if (error) throw error;

                                                                                                                                                                                                                                                                          return count || 0;
                                                                                                                                                                                                                                                                            },

                                                                                                                                                                                                                                                                              async toggleLike(postId) {
                                                                                                                                                                                                                                                                                  const liked = await this.isLiked(postId);

                                                                                                                                                                                                                                                                                      if (liked) {
                                                                                                                                                                                                                                                                                            await this.unlikePost(postId);
                                                                                                                                                                                                                                                                                                  return false;
                                                                                                                                                                                                                                                                                                      }

                                                                                                                                                                                                                                                                                                          await this.likePost(postId);
                                                                                                                                                                                                                                                                                                              return true;
                                                                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                                                                };

                                                                                                                                                                                                                                                                                                                export default LikeService;