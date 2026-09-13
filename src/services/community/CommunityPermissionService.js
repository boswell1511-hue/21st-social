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

  async getCommunitySections(communityId) {
    if (!communityId) return [];

    const { data, error } = await supabase
      .from("community_sections")
      .select("id, community_id, name, description, icon, sort_order")
      .eq("community_id", communityId)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return data ?? [];
  },

  async getAccessibleSectionIds(communityId, sectionIds = []) {
    if (!communityId || sectionIds.length === 0) return [];

    const user = await this.getCurrentUser();

    if (!user) return [];

    const { data: community, error: communityError } = await supabase
      .from("communities")
      .select("owner_id")
      .eq("id", communityId)
      .single();

    if (communityError) throw communityError;

    if (community?.owner_id === user.id) {
      return sectionIds;
    }

    const { data: member, error: memberError } = await supabase
      .from("community_members")
      .select("id")
      .eq("community_id", communityId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError) throw memberError;
    if (!member) return [];

    const { data: assignments, error: assignmentsError } = await supabase
      .from("community_member_roles")
      .select("role_id")
      .eq("member_id", member.id)
      .eq("community_id", communityId);

    if (assignmentsError) throw assignmentsError;

    const roleIds = (assignments ?? [])
      .map((assignment) => assignment.role_id)
      .filter(Boolean);

    if (roleIds.length === 0) return [];

    const { data: accessRows, error: accessError } = await supabase
      .from("community_role_section_access")
      .select("role_id, section_id, can_access")
      .in("role_id", roleIds)
      .in("section_id", sectionIds);

    if (accessError) throw accessError;

    const accessByRole = new Map(
      (accessRows ?? []).map((row) => [
        `${row.role_id}:${row.section_id}`,
        row.can_access !== false,
      ])
    );

    return sectionIds.filter((sectionId) =>
      roleIds.some((roleId) =>
        accessByRole.get(`${roleId}:${sectionId}`) !== false
      )
    );
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

  async getRoleSectionAccess(roleId) {
    if (!roleId) return [];

    const { data, error } = await supabase
      .from("community_role_section_access")
      .select("role_id, section_id, can_access")
      .eq("role_id", roleId);

    if (error) throw error;

    return data ?? [];
  },

  async setRoleSectionAccess(roleId, sectionId, canAccess) {
    const user = await this.getCurrentUser();

    if (!user) {
      throw new Error("Please sign in first.");
    }

    if (!roleId || !sectionId) {
      throw new Error("A role and section are required.");
    }

    if (canAccess) {
      const { error } = await supabase
        .from("community_role_section_access")
        .delete()
        .eq("role_id", roleId)
        .eq("section_id", sectionId);

      if (error) throw error;

      return true;
    }

    const { data, error } = await supabase
      .from("community_role_section_access")
      .upsert(
        {
          role_id: roleId,
          section_id: sectionId,
          can_access: false,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "role_id,section_id" }
      )
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async hasPermission(communityId, permissionKey) {
    if (!communityId || !permissionKey) return false;

    const { data, error } = await supabase.rpc("has_community_permission", {
      target_community: communityId,
      requested_permission: permissionKey,
    });

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
