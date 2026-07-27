import supabase from "../../lib/supabase";

const FriendService = {
  async searchUsers(search = "") {
      let query = supabase
            .from("profiles")
                  .select("id, display_name, username, avatar_url");

                      if (search.trim()) {
                            query = query.or(
                                    `display_name.ilike.%${search}%,username.ilike.%${search}%`
                                          );
                                              }

                                                  const { data, error } = await query.order("display_name");

                                                      if (error) throw error;

                                                          return data || [];
                                                            },
                                                            };

                                                            export default FriendService;