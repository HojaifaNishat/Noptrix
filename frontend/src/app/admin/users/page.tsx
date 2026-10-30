"use client";

import PeopleDirectory from "@/components/admin/people/PeopleDirectory";
import { usersApi } from "@/services/api/users.api";

export default function AdminUsersPage() {
  return (
    <PeopleDirectory
      title="Users"
      description="Manage user accounts, account status, and user information."
      entityLabel="Users"
      readPermission="users.read"
      updatePermission="users.update"
      getPeople={usersApi.getAll}
      updateStatus={usersApi.updateStatus}
    />
  );
}
