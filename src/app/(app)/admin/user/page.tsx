import { redirect } from "next/navigation";

/** Common typo: `/admin/user` → list lives at `/admin/users`. */
export default function AdminUserRedirectPage() {
  redirect("/admin/users");
}
