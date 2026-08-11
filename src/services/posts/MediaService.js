import supabase from "../../lib/supabase";

const BUCKET_NAME = "post-media";

const MediaService = {
  async getCurrentUser() {
      const {
            data: { user },
                  error,
                      } = await supabase.auth.getUser();

                          if (error) throw error;

                              return user;
                                },

                                  async uploadImage(file) {
                                      if (!file) return "";

                                          const user = await this.getCurrentUser();

                                              if (!user) {
                                                    throw new Error("No authenticated user.");
                                                        }

                                                            if (!file.type.startsWith("image/")) {
                                                                  throw new Error("Please select a valid image file.");
                                                                      }

                                                                          const extension = file.name.split(".").pop();
                                                                              const fileName = `${user.id}/${Date.now()}.${extension}`;

                                                                                  const { error } = await supabase.storage
                                                                                        .from(BUCKET_NAME)
                                                                                              .upload(fileName, file);

                                                                                                  if (error) throw error;

                                                                                                      const { data } = supabase.storage
                                                                                                            .from(BUCKET_NAME)
                                                                                                                  .getPublicUrl(fileName);

                                                                                                                      return data.publicUrl;
                                                                                                                        },

                                                                                                                          async uploadVideo(file) {
                                                                                                                              if (!file) return "";

                                                                                                                                  const user = await this.getCurrentUser();

                                                                                                                                      if (!user) {
                                                                                                                                            throw new Error("No authenticated user.");
                                                                                                                                                }

                                                                                                                                                    if (!file.type.startsWith("video/")) {
                                                                                                                                                          throw new Error("Please select a valid video file.");
                                                                                                                                                              }

                                                                                                                                                                  const extension = file.name.split(".").pop();
                                                                                                                                                                      const fileName = `${user.id}/${Date.now()}.${extension}`;

                                                                                                                                                                          const { error } = await supabase.storage
                                                                                                                                                                                .from(BUCKET_NAME)
                                                                                                                                                                                      .upload(fileName, file);

                                                                                                                                                                                          if (error) throw error;

                                                                                                                                                                                              const { data } = supabase.storage
                                                                                                                                                                                                    .from(BUCKET_NAME)
                                                                                                                                                                                                          .getPublicUrl(fileName);

                                                                                                                                                                                                              return data.publicUrl;
                                                                                                                                                                                                                },

                                                                                                                                                                                                                  async attachMedia({
                                                                                                                                                                                                                      postId,
                                                                                                                                                                                                                          mediaUrl,
                                                                                                                                                                                                                              mediaType = "image",
                                                                                                                                                                                                                                  sortOrder = 0,
                                                                                                                                                                                                                                    }) {
                                                                                                                                                                                                                                        const { data, error } = await supabase
                                                                                                                                                                                                                                              .from("post_media")
                                                                                                                                                                                                                                                    .insert({
                                                                                                                                                                                                                                                            post_id: postId,
                                                                                                                                                                                                                                                                    media_url: mediaUrl,
                                                                                                                                                                                                                                                                            media_type: mediaType,
                                                                                                                                                                                                                                                                                    sort_order: sortOrder,
                                                                                                                                                                                                                                                                                          })
                                                                                                                                                                                                                                                                                                .select()
                                                                                                                                                                                                                                                                                                      .single();

                                                                                                                                                                                                                                                                                                          if (error) throw error;

                                                                                                                                                                                                                                                                                                              return data;
                                                                                                                                                                                                                                                                                                                },

                                                                                                                                                                                                                                                                                                                  async getPostMedia(postId) {
                                                                                                                                                                                                                                                                                                                      const { data, error } = await supabase
                                                                                                                                                                                                                                                                                                                            .from("post_media")
                                                                                                                                                                                                                                                                                                                                  .select("*")
                                                                                                                                                                                                                                                                                                                                        .eq("post_id", postId)
                                                                                                                                                                                                                                                                                                                                              .order("sort_order", { ascending: true });

                                                                                                                                                                                                                                                                                                                                                  if (error) throw error;

                                                                                                                                                                                                                                                                                                                                                      return data || [];
                                                                                                                                                                                                                                                                                                                                                        },

                                                                                                                                                                                                                                                                                                                                                          async deleteMedia(url) {
                                                                                                                                                                                                                                                                                                                                                              if (!url) return;

                                                                                                                                                                                                                                                                                                                                                                  const parts = url.split("/post-media/");

                                                                                                                                                                                                                                                                                                                                                                      if (parts.length < 2) return;

                                                                                                                                                                                                                                                                                                                                                                          const filePath = parts[1];

                                                                                                                                                                                                                                                                                                                                                                              const { error } = await supabase.storage
                                                                                                                                                                                                                                                                                                                                                                                    .from(BUCKET_NAME)
                                                                                                                                                                                                                                                                                                                                                                                          .remove([filePath]);

                                                                                                                                                                                                                                                                                                                                                                                              if (error) throw error;

                                                                                                                                                                                                                                                                                                                                                                                                  return true;
                                                                                                                                                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                                                                                                                                                    };

                                                                                                                                                                                                                                                                                                                                                                                                    export default MediaService;