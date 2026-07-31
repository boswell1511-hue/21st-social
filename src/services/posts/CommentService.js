import supabase from "../../lib/supabase";

const CommentService = {
  async getCurrentUser() {
      const {
            data: { user },
                  error,
                      } = await supabase.auth.getUser();

                          if (error) throw error;

                              return user;
                                },

                                  async createComment(postId, content) {
                                      const user = await this.getCurrentUser();

                                          if (!user) {
                                                throw new Error("No authenticated user.");
                                                    }

                                                        const { data, error } = await supabase
                                                              .from("comments")
                                                                    .insert({
                                                                            user_id: user.id,
                                                                                    post_id: postId,
                                                                                            content,
                                                                                                  })
                                                                                                        .select()
                                                                                                              .single();

                                                                                                                  if (error) throw error;

                                                                                                                      return data;
                                                                                                                        },

                                                                                                                          async getComments(postId) {
                                                                                                                              const { data, error } = await supabase
                                                                                                                                    .from("comments")
                                                                                                                                          .select(`
                                                                                                                                                  *,
                                                                                                                                                          profiles (
                                                                                                                                                                    id,
                                                                                                                                                                              display_name,
                                                                                                                                                                                        username,
                                                                                                                                                                                                  avatar_url
                                                                                                                                                                                                          )
                                                                                                                                                                                                                `)
                                                                                                                                                                                                                      .eq("post_id", postId)
                                                                                                                                                                                                                            .order("created_at", { ascending: true });

                                                                                                                                                                                                                                if (error) throw error;

                                                                                                                                                                                                                                    return data || [];
                                                                                                                                                                                                                                      },

                                                                                                                                                                                                                                        async getCommentCount(postId) {
                                                                                                                                                                                                                                            const { count, error } = await supabase
                                                                                                                                                                                                                                                  .from("comments")
                                                                                                                                                                                                                                                        .select("*", {
                                                                                                                                                                                                                                                                count: "exact",
                                                                                                                                                                                                                                                                        head: true,
                                                                                                                                                                                                                                                                              })
                                                                                                                                                                                                                                                                                    .eq("post_id", postId);

                                                                                                                                                                                                                                                                                        if (error) throw error;

                                                                                                                                                                                                                                                                                            return count || 0;
                                                                                                                                                                                                                                                                                              },

                                                                                                                                                                                                                                                                                                async deleteComment(commentId) {
                                                                                                                                                                                                                                                                                                    const { error } = await supabase
                                                                                                                                                                                                                                                                                                          .from("comments")
                                                                                                                                                                                                                                                                                                                .delete()
                                                                                                                                                                                                                                                                                                                      .eq("id", commentId);

                                                                                                                                                                                                                                                                                                                          if (error) throw error;

                                                                                                                                                                                                                                                                                                                              return true;
                                                                                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                                                                                };

                                                                                                                                                                                                                                                                                                                                export default CommentService;