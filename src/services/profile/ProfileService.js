import supabase from "../../lib/supabase";

const BUCKET_NAME = "avatars";

const ProfileService = {
  async getCurrentUser() {
      const {
            data: { user },
                  error,
                      } = await supabase.auth.getUser();

                          if (error) throw error;

                              return user;
                                },

                                  async profileExists() {
                                      const user = await this.getCurrentUser();

                                          if (!user) return false;

                                              const { data, error } = await supabase
                                                    .from("profiles")
                                                          .select("id")
                                                                .eq("id", user.id)
                                                                      .maybeSingle();

                                                                          if (error) throw error;

                                                                              return !!data;
                                                                                },

                                                                                  async getProfile() {
                                                                                      const user = await this.getCurrentUser();

                                                                                          if (!user) return null;

                                                                                              const { data, error } = await supabase
                                                                                                    .from("profiles")
                                                                                                          .select("*")
                                                                                                                .eq("id", user.id)
                                                                                                                      .single();

                                                                                                                          if (error) throw error;

                                                                                                                              return data;
                                                                                                                                },

                                                                                                                                  async createProfile(profile) {
                                                                                                                                      const user = await this.getCurrentUser();

                                                                                                                                          if (!user) {
                                                                                                                                                throw new Error("No authenticated user.");
                                                                                                                                                    }

                                                                                                                                                        const { data, error } = await supabase
                                                                                                                                                              .from("profiles")
                                                                                                                                                                    .insert({
                                                                                                                                                                            id: user.id,
                                                                                                                                                                                    ...profile,
                                                                                                                                                                                          })
                                                                                                                                                                                                .select()
                                                                                                                                                                                                      .single();

                                                                                                                                                                                                          if (error) throw error;

                                                                                                                                                                                                              return data;
                                                                                                                                                                                                                },

                                                                                                                                                                                                                  async updateProfile(profile) {
                                                                                                                                                                                                                      const user = await this.getCurrentUser();

                                                                                                                                                                                                                          if (!user) {
                                                                                                                                                                                                                                throw new Error("No authenticated user.");
                                                                                                                                                                                                                                    }

                                                                                                                                                                                                                                        const { data, error } = await supabase
                                                                                                                                                                                                                                              .from("profiles")
                                                                                                                                                                                                                                                    .update(profile)
                                                                                                                                                                                                                                                          .eq("id", user.id)
                                                                                                                                                                                                                                                                .select()
                                                                                                                                                                                                                                                                      .single();

                                                                                                                                                                                                                                                                          if (error) throw error;

                                                                                                                                                                                                                                                                              return data;
                                                                                                                                                                                                                                                                                },

                                                                                                                                                                                                                                                                                  async uploadAvatar(file) {
                                                                                                                                                                                                                                                                                      if (!file) return "";

                                                                                                                                                                                                                                                                                          const user = await this.getCurrentUser();

                                                                                                                                                                                                                                                                                              if (!user) {
                                                                                                                                                                                                                                                                                                    throw new Error("No authenticated user.");
                                                                                                                                                                                                                                                                                                        }

                                                                                                                                                                                                                                                                                                            const fileName = `${user.id}-${Date.now()}`;

                                                                                                                                                                                                                                                                                                                const { error } = await supabase.storage
                                                                                                                                                                                                                                                                                                                      .from(BUCKET_NAME)
                                                                                                                                                                                                                                                                                                                            .upload(fileName, file);

                                                                                                                                                                                                                                                                                                                                if (error) throw error;

                                                                                                                                                                                                                                                                                                                                    const { data } = supabase.storage
                                                                                                                                                                                                                                                                                                                                          .from(BUCKET_NAME)
                                                                                                                                                                                                                                                                                                                                                .getPublicUrl(fileName);

                                                                                                                                                                                                                                                                                                                                                    return data.publicUrl;
                                                                                                                                                                                                                                                                                                                                                      },

                                                                                                                                                                                                                                                                                                                                                        async refreshProfile() {
                                                                                                                                                                                                                                                                                                                                                            return await this.getProfile();
                                                                                                                                                                                                                                                                                                                                                              },

                                                                                                                                                                                                                                                                                                                                                                async deleteProfile() {
                                                                                                                                                                                                                                                                                                                                                                    const user = await this.getCurrentUser();

                                                                                                                                                                                                                                                                                                                                                                        if (!user) {
                                                                                                                                                                                                                                                                                                                                                                              throw new Error("No authenticated user.");
                                                                                                                                                                                                                                                                                                                                                                                  }

                                                                                                                                                                                                                                                                                                                                                                                      const { error } = await supabase
                                                                                                                                                                                                                                                                                                                                                                                            .from("profiles")
                                                                                                                                                                                                                                                                                                                                                                                                  .delete()
                                                                                                                                                                                                                                                                                                                                                                                                        .eq("id", user.id);

                                                                                                                                                                                                                                                                                                                                                                                                            if (error) throw error;

                                                                                                                                                                                                                                                                                                                                                                                                                return true;
                                                                                                                                                                                                                                                                                                                                                                                                                  },
                                                                                                                                                                                                                                                                                                                                                                                                                  };

                                                                                                                                                                                                                                                                                                                                                                                                                  export default ProfileService;