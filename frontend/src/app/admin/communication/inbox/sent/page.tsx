import { redirect } from "next/navigation";

export default function SentMessagesPage() {
  redirect("/admin/communication/inbox");
}
