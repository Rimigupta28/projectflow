import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
function useProjectRole(project) {
  const { user } = useAuth();
  const role = useMemo(() => {
    if (user?.role === "ADMIN") return "ADMIN";
    return project?.members.find((member) => (typeof member.user === "string" ? member.user : member.user.id) === user?.id)?.role;
  }, [project, user]);
  const can = (action) => {
    if (role === "ADMIN") return true;
    if (action === "read") return Boolean(role);
    if (action === "manage" || action === "write") return role === "PROJECT_MANAGER";
    if (action === "comment") return role === "PROJECT_MANAGER" || role === "TEAM_MEMBER";
    return false;
  };
  return { role, can };
}
export {
  useProjectRole
};
