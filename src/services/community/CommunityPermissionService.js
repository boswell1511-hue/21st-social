import supabase from "../../lib/supabase";

const CommunityPermissionService = {
  async getCurrentUser() {
      const {
            data: { user },
                } = await supabase.auth.getUser();

                    return user;
                      },

                        async getPermissions(category = null) {
                            let query = supabase
                                  .from("community_permissions")
                                        .select("*")
                                              .order("category", { ascending: true })
                                                    .order("name", { ascending: true });

                                                        if (category) {
                                                              query = query.eq("category", category);
                                                                  }

                                                                      const { data, error } = await query;

                                                                          if (error) throw error;

                                                                              return data ?? [];
                                                                                },

                                                                                  async getRolePermissions(roleId) {
                                                                                      if (!roleId) return [];

                                                                                          const { data: assignments, error: assignmentsError } = await supabase
                                                                                                .from("community_role_permissions")
                                                                                                      .select("permission_id")
                                                                                                            .eq("role_id", roleId);

                                                                                                                if (assignmentsError) throw assignmentsError;

                                                                                                                    const permissionIds = (assignments ?? [])
                                                                                                                          .map((assignment) => assignment.permission_id)
                                                                                                                                .filter(Boolean);

                                                                                                                                    if (permissionIds.length === 0) return [];

                                                                                                                                        const { data, error } = await supabase
                                                                                                                                              .from("community_permissions")
                                                                                                                                                    .select("*")
                                                                                                                                                          .in("id", permissionIds)
                                                                                                                                                                .order("category", { ascending: true })
                                                                                                                                                                      .order("name", { ascending: true });

                                                                                                                                                                          if (error) throw error;

                                                                                                                                                                              return data ?? [];
                                                                                                                                                                                },

                                                                                                                                                                                  async hasPermission(communityId, permissionKey) {
                                                                                                                                                                                      if (!communityId || !permissionKey) return false;

                                                                                                                                                                                          const { data, error } = await supabase.rpc(
                                                                                                                                                                                                "has_community_permission",
                                                                                                                                                                                                      {
                                                                                                                                                                                                              target_community: communityId,
                                                                                                                                                                                                                      requested_permission: permissionKey,
                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                );

                                                                                                                                                                                                                                    if (error) throw error;

                                                                                                                                                                                                                                        return data === true;
                                                                                                                                                                                                                                          },

                                                                                                                                                                                                                                            async grantPermission(roleId, permissionId) {
                                                                                                                                                                                                                                                const user = await this.getCurrentUser();

                                                                                                                                                                                                                                                    if (!user) {
                                                                                                                                                                                                                                                          throw new Error("Please sign in first.");
                                                                                                                                                                                                                                                              }

                                                                                                                                                                                                                                                                  if (!roleId || !permissionId) {
                                                                                                                                                                                                                                                                        throw new Error("A role and permission are required.");
                                                                                                                                                                                                                                                                            }

                                                                                                                                                                                                                                                                                const { data: existing, error: existingError } = await supabase
                                                                                                                                                                                                                                                                                      .from("community_role_permissions")
                                                                                                                                                                                                                                                                                            .select("role_id, permission_id")
                                                                                                                                                                                                                                                                                                  .eq("role_id", roleId)
                                                                                                                                                                                                                                                                                                        .eq("permission_id", permissionId)
                                                                                                                                                                                                                                                                                                              .maybeSingle();

                                                                                                                                                                                                                                                                                                                  if (existingError) throw existingError;

                                                                                                                                                                                                                                                                                                                      if (existing) {
                                                                                                                                                                                                                                                                                                                            return {
                                                                                                                                                                                                                                                                                                                                    alreadyGranted: true,
                                                                                                                                                                                                                                                                                                                                            roleId,
                                                                                                                                                                                                                                                                                                                                                    permissionId,
                                                                                                                                                                                                                                                                                                                                                          };
                                                                                                                                                                                                                                                                                                                                                              }

                                                                                                                                                                                                                                                                                                                                                                  const { data, error } = await supabase
                                                                                                                                                                                                                                                                                                                                                                        .from("community_role_permissions")
                                                                                                                                                                                                                                                                                                                                                                              .insert({
                                                                                                                                                                                                                                                                                                                                                                                      role_id: roleId,
                                                                                                                                                                                                                                                                                                                                                                                              permission_id: permissionId,
                                                                                                                                                                                                                                                                                                                                                                                                      granted_by: user.id,
                                                                                                                                                                                                                                                                                                                                                                                                            })
                                                                                                                                                                                                                                                                                                                                                                                                                  .select()
                                                                                                                                                                                                                                                                                                                                                                                                                        .single();

                                                                                                                                                                                                                                                                                                                                                                                                                            if (error) throw error;

                                                                                                                                                                                                                                                                                                                                                                                                                                return data;
                                                                                                                                                                                                                                                                                                                                                                                                                                  },

                                                                                                                                                                                                                                                                                                                                                                                                                                    async revokePermission(roleId, permissionId) {
                                                                                                                                                                                                                                                                                                                                                                                                                                        if (!roleId || !permissionId) {
                                                                                                                                                                                                                                                                                                                                                                                                                                              throw new Error("A role and permission are required.");
                                                                                                                                                                                                                                                                                                                                                                                                                                                  }

                                                                                                                                                                                                                                                                                                                                                                                                                                                      const { error } = await supabase
                                                                                                                                                                                                                                                                                                                                                                                                                                                            .from("community_role_permissions")
                                                                                                                                                                                                                                                                                                                                                                                                                                                                  .delete()
                                                                                                                                                                                                                                                                                                                                                                                                                                                                        .eq("role_id", roleId)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                              .eq("permission_id", permissionId);

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  if (error) throw error;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      return true;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        };

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        export default CommunityPermissionService;