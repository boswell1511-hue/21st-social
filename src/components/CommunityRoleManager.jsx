import { useEffect, useState } from "react";
import CommunityMembershipService from "../services/community/CommunityMembershipService";
import CommunityPermissionService from "../services/community/CommunityPermissionService";

function memberLabel(member) {
  const profile = member.profile;
  if (profile?.display_name) {
    return profile.username
      ? `${profile.display_name} (@${profile.username})`
      : profile.display_name;
  }
  if (profile?.username) return `@${profile.username}`;
  return `Member ${member.user_id.slice(0, 8)}`;
}

function CommunityRoleManager({ communityId, isOwner }) {
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [memberRoles, setMemberRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [loadingRolePermissions, setLoadingRolePermissions] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [newRoleIsModerator, setNewRoleIsModerator] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMemberRoles, setLoadingMemberRoles] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isOwner || !communityId) return;
    loadManagerData();
  }, [communityId, isOwner]);

  useEffect(() => {
    if (!selectedMemberId) {
      setMemberRoles([]);
      return;
    }
    loadSelectedMemberRoles(selectedMemberId);
  }, [selectedMemberId]);

  useEffect(() => {
    if (!selectedRoleId) {
      setRolePermissions([]);
      return;
    }
    loadSelectedRolePermissions(selectedRoleId);
  }, [selectedRoleId]);

  async function loadManagerData() {
    setLoading(true);
    setError("");
    try {
      const [nextMembers, nextRoles, nextPermissions] = await Promise.all([
        CommunityMembershipService.getCommunityMembers(communityId),
        CommunityMembershipService.getCommunityRoles(communityId),
        CommunityPermissionService.getPermissions(),
      ]);
      setMembers(nextMembers);
      setRoles(nextRoles);
      setPermissions(nextPermissions);
      setSelectedMemberId((current) =>
        current && nextMembers.some((member) => member.id === current)
          ? current
          : nextMembers[0]?.id ?? ""
      );
      setSelectedRoleId((current) =>
        current && nextRoles.some((role) => role.id === current)
          ? current
          : nextRoles[0]?.id ?? ""
      );
    } catch (loadError) {
      console.error(loadError);
      setError(loadError.message || "Unable to load community members and roles.");
    } finally {
      setLoading(false);
    }
  }

  async function loadSelectedMemberRoles(memberId) {
    setLoadingMemberRoles(true);
    setError("");
    try {
      setMemberRoles(
        await CommunityMembershipService.getMemberRoles(memberId)
      );
    } catch (loadError) {
      console.error(loadError);
      setError(loadError.message || "Unable to load member roles.");
    } finally {
      setLoadingMemberRoles(false);
    }
  }

  async function loadSelectedRolePermissions(roleId) {
    setLoadingRolePermissions(true);
    setError("");
    try {
      setRolePermissions(
        await CommunityPermissionService.getRolePermissions(roleId)
      );
    } catch (loadError) {
      console.error(loadError);
      setError(loadError.message || "Unable to load role permissions.");
    } finally {
      setLoadingRolePermissions(false);
    }
  }

  async function togglePermission(permission, enabled) {
    if (!selectedRoleId || saving) return;

    const selectedRole = roles.find((role) => role.id === selectedRoleId);
    if (!selectedRole) return;

    if (permission.moderator_only && !selectedRole.is_moderator) {
      setError("This permission is available only to moderator roles.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (enabled) {
        await CommunityPermissionService.grantPermission(
          selectedRoleId,
          permission.id
        );
        setRolePermissions((current) =>
          current.some((item) => item.id === permission.id)
            ? current
            : [...current, permission]
        );
        setSuccess(`Permission “${permission.name}” granted.`);
      } else {
        await CommunityPermissionService.revokePermission(
          selectedRoleId,
          permission.id
        );
        setRolePermissions((current) =>
          current.filter((item) => item.id !== permission.id)
        );
        setSuccess(`Permission “${permission.name}” revoked.`);
      }
    } catch (permissionError) {
      console.error(permissionError);
      setError(
        permissionError.message ||
          `Unable to ${enabled ? "grant" : "revoke"} this permission.`
      );
    } finally {
      setSaving(false);
    }
  }

  async function createSelectedRole() {
    const trimmedName = newRoleName.trim();
    if (!trimmedName) {
      setError("Please enter a role name.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const createdRole = await CommunityMembershipService.createRole(
        communityId,
        {
          name: trimmedName,
          description: newRoleDescription,
          isModerator: newRoleIsModerator,
        }
      );

      setRoles((current) => {
        const next = [...current, createdRole].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        return next;
      });
      setSelectedRoleId(createdRole.id);
      setNewRoleName("");
      setNewRoleDescription("");
      setNewRoleIsModerator(false);
      setSuccess(`Role “${createdRole.name}” created successfully.`);
    } catch (createError) {
      console.error(createError);
      setError(createError.message || "Unable to create this role.");
    } finally {
      setSaving(false);
    }
  }

  async function assignSelectedRole() {
    if (!selectedMemberId || !selectedRoleId) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await CommunityMembershipService.assignRole(selectedMemberId, selectedRoleId);
      await loadSelectedMemberRoles(selectedMemberId);
      setSuccess("Role assigned successfully.");
    } catch (assignError) {
      console.error(assignError);
      setError(assignError.message || "Unable to assign this role.");
    } finally {
      setSaving(false);
    }
  }

  async function removeAssignedRole(roleId) {
    if (!selectedMemberId || !roleId) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await CommunityMembershipService.removeRole(selectedMemberId, roleId);
      await loadSelectedMemberRoles(selectedMemberId);
      setSuccess("Role removed successfully.");
    } catch (removeError) {
      console.error(removeError);
      setError(removeError.message || "Unable to remove this role.");
    } finally {
      setSaving(false);
    }
  }

  if (!isOwner) return null;

  const selectStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #444",
    background: "#111",
    color: "#fff",
  };

  const inputStyle = {
    ...selectStyle,
    boxSizing: "border-box",
  };

  return (
    <section style={{
      marginTop: "30px", padding: "20px", borderRadius: "16px",
      background: "#18181b", border: "1px solid #333",
    }}>
      <h2 style={{ marginTop: 0 }}>Manage Members & Roles</h2>
      <p style={{ opacity: 0.7 }}>
        Create community roles, assign them to joined members, and configure their permissions.
      </p>

      {error && (
        <div style={{
          marginTop: "12px", padding: "12px", borderRadius: "10px",
          background: "#3f1d1d",
        }}>{error}</div>
      )}

      {success && (
        <div style={{
          marginTop: "12px", padding: "12px", borderRadius: "10px",
          background: "#12351f",
        }}>{success}</div>
      )}

      <div style={{
        marginTop: "20px", padding: "16px", borderRadius: "12px",
        background: "#111", border: "1px solid #333",
      }}>
        <h3 style={{ marginTop: 0 }}>Create Role</h3>
        <p style={{ opacity: 0.7 }}>
          Create a named role for this community. You can configure its permissions below.
        </p>

        <label style={{ display: "block", marginTop: "14px", marginBottom: "8px", fontWeight: "bold" }}>
          Role Name
        </label>
        <input
          type="text"
          value={newRoleName}
          onChange={(event) => setNewRoleName(event.target.value)}
          placeholder="e.g. Moderator"
          disabled={saving}
          style={inputStyle}
        />

        <label style={{ display: "block", marginTop: "14px", marginBottom: "8px", fontWeight: "bold" }}>
          Description
        </label>
        <input
          type="text"
          value={newRoleDescription}
          onChange={(event) => setNewRoleDescription(event.target.value)}
          placeholder="Optional role description"
          disabled={saving}
          style={inputStyle}
        />

        <label style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "14px", cursor: saving ? "default" : "pointer" }}>
          <input
            type="checkbox"
            checked={newRoleIsModerator}
            onChange={(event) => setNewRoleIsModerator(event.target.checked)}
            disabled={saving}
          />
          <span>Moderator role</span>
        </label>

        <button type="button" onClick={createSelectedRole}
          disabled={saving || !newRoleName.trim()}
          style={{
            marginTop: "14px", padding: "12px 18px", borderRadius: "10px",
            border: "none", background: "#7c3aed", color: "#fff",
            fontWeight: "bold", cursor: saving ? "default" : "pointer",
            opacity: saving || !newRoleName.trim() ? 0.7 : 1,
          }}>
          {saving ? "Saving..." : "Create Role"}
        </button>
      </div>

      {loading ? <p>Loading members and roles...</p> : (
        <>
          <label style={{ display: "block", marginTop: "20px", marginBottom: "8px", fontWeight: "bold" }}>
            Select Member
          </label>
          <select value={selectedMemberId}
            onChange={(event) => setSelectedMemberId(event.target.value)}
            disabled={saving || members.length === 0}
            style={selectStyle}>
            {members.length === 0 ? (
              <option value="">No joined members yet</option>
            ) : members.map((member) => (
              <option key={member.id} value={member.id}>
                {memberLabel(member)}{member.role ? ` — ${member.role}` : ""}
              </option>
            ))}
          </select>

          <label style={{ display: "block", marginTop: "16px", marginBottom: "8px", fontWeight: "bold" }}>
            Select Role
          </label>
          <select value={selectedRoleId}
            onChange={(event) => setSelectedRoleId(event.target.value)}
            disabled={saving || roles.length === 0}
            style={selectStyle}>
            {roles.length === 0 ? (
              <option value="">No community roles available</option>
            ) : roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}{role.is_moderator ? " — moderator" : ""}{role.description ? ` — ${role.description}` : ""}
              </option>
            ))}
          </select>

          <div style={{
            marginTop: "20px", padding: "16px", borderRadius: "12px",
            background: "#111", border: "1px solid #333",
          }}>
            <h3 style={{ marginTop: 0 }}>Role Permissions</h3>
            <p style={{ opacity: 0.7 }}>
              Choose what the selected role can do in this community. Changes save immediately.
            </p>

            {loadingRolePermissions ? <p>Loading permissions...</p> : permissions.length === 0 ? (
              <p style={{ opacity: 0.7 }}>No permissions are available.</p>
            ) : (
              [...new Set(permissions.map((permission) => permission.category))].map((category) => {
                const categoryPermissions = permissions.filter(
                  (permission) => permission.category === category
                );
                const selectedRole = roles.find((role) => role.id === selectedRoleId);

                return (
                  <div key={category} style={{ marginTop: "16px" }}>
                    <h4 style={{ margin: "0 0 8px", textTransform: "capitalize" }}>
                      {category}
                    </h4>
                    {categoryPermissions.map((permission) => {
                      const checked = rolePermissions.some(
                        (item) => item.id === permission.id
                      );
                      const disabled =
                        saving ||
                        !selectedRoleId ||
                        (permission.moderator_only && !selectedRole?.is_moderator);

                      return (
                        <label key={permission.id} style={{
                          display: "flex", alignItems: "flex-start", gap: "10px",
                          marginTop: "10px", padding: "10px", borderRadius: "8px",
                          background: "#18181b", opacity: disabled ? 0.6 : 1,
                          cursor: disabled ? "default" : "pointer",
                        }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={(event) =>
                              togglePermission(permission, event.target.checked)
                            }
                          />
                          <span>
                            <strong>{permission.name}</strong>
                            {permission.description && (
                              <span style={{ display: "block", marginTop: "3px", fontSize: "13px", opacity: 0.7 }}>
                                {permission.description}
                              </span>
                            )}
                            {permission.moderator_only && (
                              <span style={{ display: "block", marginTop: "3px", fontSize: "12px", opacity: 0.7 }}>
                                Moderator only
                              </span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>

          <button type="button" onClick={assignSelectedRole}
            disabled={saving || !selectedMemberId || !selectedRoleId || roles.length === 0}
            style={{
              marginTop: "14px", padding: "12px 18px", borderRadius: "10px",
              border: "none", background: "#7c3aed", color: "#fff",
              fontWeight: "bold", cursor: saving ? "default" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}>
            {saving ? "Saving..." : "Assign Role"}
          </button>

          <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #333" }}>
            <h3 style={{ marginTop: 0 }}>Assigned Roles</h3>
            {loadingMemberRoles ? <p>Loading assigned roles...</p> :
              memberRoles.length === 0 ? (
                <p style={{ opacity: 0.7 }}>This member has no additional community roles.</p>
              ) : memberRoles.map((role) => (
                <div key={role.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: "12px", marginTop: "10px", padding: "12px",
                  borderRadius: "10px", background: "#111",
                }}>
                  <div>
                    <strong>{role.name}</strong>
                    {role.is_moderator && (
                      <div style={{ marginTop: "4px", fontSize: "13px", opacity: 0.7 }}>
                        Moderator
                      </div>
                    )}
                    {role.description && (
                      <div style={{ marginTop: "4px", fontSize: "13px", opacity: 0.7 }}>
                        {role.description}
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={() => removeAssignedRole(role.id)}
                    disabled={saving}
                    style={{
                      padding: "8px 12px", borderRadius: "8px",
                      border: "1px solid #7f1d1d", background: "#3f1d1d",
                      color: "#fff", cursor: saving ? "default" : "pointer",
                    }}>
                    Remove
                  </button>
                </div>
              ))}
          </div>

          <button type="button" onClick={loadManagerData}
            disabled={loading || saving}
            style={{
              marginTop: "16px", padding: "9px 14px", borderRadius: "8px",
              border: "1px solid #444", background: "#222", color: "#fff",
              cursor: "pointer",
            }}>
            Refresh Members
          </button>
        </>
      )}
    </section>
  );
}

export default CommunityRoleManager;
