"use client";

import PeopleDirectory from "@/components/admin/people/PeopleDirectory";
import { customersApi } from "@/services/api/customers.api";

export default function AdminCustomersPage() {
  return (
    <PeopleDirectory
      title="Customers"
      description="View and manage customer profiles, account information, and customer relationships."
      entityLabel="Customers"
      readPermission="customers.read"
      updatePermission="customers.update"
      getPeople={customersApi.getAll}
      updateStatus={customersApi.updateStatus}
    />
  );
}
