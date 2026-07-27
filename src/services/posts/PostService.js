import supabase from "../../lib/supabase";

const PostService = {
  async getCurrentUser() {
      const {
            data: { user },
                  error,
                      } = await supabase.auth.getUser();

                          if (error) throw error;

                              return user;
                                },

                                  async createPost(content, imageUrl = null) {
                                      const user = await this.getCurrentUser();

                                          if (!user) {
                                                throw new Error("No authenticated user.");
                                                    }

                                                        const { data, error } = await supabase
                                                              .from("posts")
                                                                    .insert({
                                                                            user_id: user.id,
                                                                                    content,
                                                                                            image_url: imageUrl,
                                                                                                  })
                                                                                                        .select()
                                                                                                              .single();

                                                                                                                  if (error) throw error;

                                                                                                                      return data;
                                                                                                                        },

                                                                                                                          async getFeed() {
                                                                                                                              const { data, error } = await supabase
                                                                                                                                    .from("posts")
                                                                                                                                          .select(`
                                                                                                                                                  *,
                                                                                                                                                          profiles (
                                                                                                                                                                    id,
                                                                                                                                                                              username,
                                                                                                                                                                                        display_name,
                                                                                                                                                                                                  avatar_url
                                                                                                                                                                                                          )
                                                                                                                                                                                                                `)
                                                                                                                                                                                                                      .order("created_at", { ascending: false });

                                                                                                                                                                                                                          if (error) throw error;

                                                                                                                                                                                                                              return data || [];
                                                                                                                                                                                                                                },

                                                                                                                                                                                                                                  async getUserPosts(userId) {
                                                                                                                                                                                                                                      const { data, error } = await supabase
                                                                                                                                                                                                                                            .from("posts")
                                                                                                                                                                                                                                                  .select(`
                                                                                                                                                                                                                                                          *,
                                                                                                                                                                                                                                                                  profiles (
                                                                                                                                                                                                                                                                            id,
                                                                                                                                                                                                                                                                                      username,
                                                                                                                                                                                                                                                                                                display_name,
                                                                                                                                                                                                                                                                                                          avatar_url
                                                                                                                                                                                                                                                                                                                  )
                                                                                                                                                                                                                                                                                                                        `)
                                                                                                                                                                                                                                                                                                                              .eq("user_id", userId)
                                                                                                                                                                                                                                                                                                                                    .order("created_at", { ascending: false });

                                                                                                                                                                                                                                                                                                                                        if (error) throw error;

                                                                                                                                                                                                                                                                                                                                            return data || [];
                                                                                                                                                                                                                                                                                                                                              },

                                                                                                                                                                                                                                                                                                                                                async deletePost(postId) {
                                                                                                                                                                                                                                                                                                                                                    const { error } = await supabase
                                                                                                                                                                                                                                                                                                                                                          .from("posts")
                                                                                                                                                                                                                                                                                                                                                                .delete()
                                                                                                                                                                                                                                                                                                                                                                      .eq("id", postId);

                                                                                                                                                                                                                                                                                                                                                                          if (error) throw error;

                                                                                                                                                                                                                                                                                                                                                                              return true;
                                                                                                                                                                                                                                                                                                                                                                                },
                                                                                                                                                                                                                                                                                                                                                                                };

                                                                                                                                                                                                                                                                                                                                                                                export default PostService;