import supabase from "../../lib/supabase";

const CommunityMembershipService = {
  // =========================
  // MEMBERSHIP
  // =========================

  async getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;
  },

  async isMember(communityId) {
    const user = await this.getCurrentUser();

    if (!user) return false;

    const { data } = await supabase
      .from("community_members")
      .select("id")
      .eq("community_id", communityId)
      .eq("user_id", user.id)
      .maybeSingle();

    return !!data;
  },

  async join(communityId) {
    const user = await this.getCurrentUser();

    if (!user) throw new Error("Please sign in first.");

    const { error } = await supabase
      .from("community_members")
      .insert({
        community_id: communityId,
        user_id: user.id,
        role: "member",
        status: "joined",
      });

    if (error) throw error;

    const { data: community } = await supabase
      .from("communities")
      .select("member_count")
      .eq("id", communityId)
      .single();

    await supabase
      .from("communities")
      .update({
        member_count: (community.member_count ?? 0) + 1,
      })
      .eq("id", communityId);
  },

  async leave(communityId) {
    const user = await this.getCurrentUser();

    if (!user) throw new Error("Please sign in first.");

    const { error } = await supabase
      .from("community_members")
      .delete()
      .eq("community_id", communityId)
      .eq("user_id", user.id);

    if (error) throw error;

    const { data: community } = await supabase
      .from("communities")
      .select("member_count")
      .eq("id", communityId)
      .single();

    await supabase
      .from("communities")
      .update({
        member_count: Math.max((community.member_count ?? 1) - 1, 0),
      })
      .eq("id", communityId);
  },

  async toggle(communityId) {
    const joined = await this.isMember(communityId);

    if (joined) {
      return this.leave(communityId);
    }

    return this.join(communityId);
  },

  // =========================
  // COMMUNITY MEMBERS
  // =========================

  async getCommunityMembers(communityId) {
    const { data: members, error: membersError } = await supabase
      .from("community_members")
      .select("id, community_id, user_id, role, status, created_at")
      .eq("community_id", communityId)
      .eq("status", "joined")
      .order("created_at", { ascending: true });

    if (membersError) throw membersError;

    const userIds = (members ?? [])
      .map((member) => member.user_id)
      .filter(Boolean);

    if (userIds.length === 0) return [];

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url")
      .in("id", userIds);

    if (profilesError) throw profilesError;

    const profilesById = new Map(
      (profiles ?? []).map((profile) => [profile.id, profile])
    );

    return (members ?? []).map((member) => ({
      ...member,
      profile: profilesById.get(member.user_id) ?? null,
    }));
  },

  // =========================
  // COMMUNITY ROLES
  // =========================

  async getCommunityRoles(communityId) {
    const { data, error } = await supabase
      .from("community_roles")
      .select("*")
      .eq("community_id", communityId)
      .order("name", { ascending: true });

    if (error) throw error;

    return data ?? [];
  },

  async getMemberRoles(memberId) {
    const { data: assignments, error: assignmentsError } = await supabase
      .from("community_member_roles")
      .select("role_id")
      .eq("member_id", memberId);

    if (assignmentsError) throw assignmentsError;

    const roleIds = (assignments ?? [])
      .map((assignment) => assignment.role_id)
      .filter(Boolean);

    if (roleIds.length === 0) return [];

    const { data: roles, error: rolesError } = await supabase
      .from("community_roles")
      .select("*")
      .in("id", roleIds)
      .order("name", { ascending: true });

    if (rolesError) throw rolesError;

    return roles ?? [];
  },

  async hasRole(memberId, roleId) {
    const { data, error } = await supabase
      .from("community_member_roles")
      .select("id")
      .eq("member_id", memberId)
      .eq("role_id", roleId)
      .maybeSingle();

    if (error) throw error;

    return !!data;
  },

  async assignRole(memberId, roleId) {
    const user = await this.getCurrentUser();

    if (!user) throw new Error("Please sign in first.");

    const { data: member, error: memberError } = await supabase
      .from("community_members")
      .select("id, community_id")
      .eq("id", memberId)
      .single();

    if (memberError) throw memberError;

    const { data: role, error: roleError } = await supabase
      .from("community_roles")
      .select("id, community_id")
      .eq("id", roleId)
      .single();

    if (roleError) throw roleError;

    if (member.community_id !== role.community_id) {
      throw new Error("This role does not belong to the member's community.");
    }

    const alreadyAssigned = await this.hasRole(memberId, roleId);

    if (alreadyAssigned) {
      return {
        alreadyAssigned: true,
        memberId,
        roleId,
      };
    }

    const { data, error } = await supabase
      .from("community_member_roles")
      .insert({
        community_id: member.community_id,
        member_id: memberId,
        role_id: roleId,
        assigned_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async removeRole(memberId, roleId) {
    const { error } = await supabase
      .from("community_member_roles")
      .delete()
      .eq("member_id", memberId)
      .eq("role_id", roleId);

    if (error) throw error;

    return true;
  },
};

export default CommunityMembershipService;
