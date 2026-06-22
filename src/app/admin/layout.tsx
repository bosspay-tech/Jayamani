import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    redirect("/admin-access");
  }

  return (
    <div className="min-h-screen bg-background lg:flex">
      <AdminNav />
      <div className="flex-1">
        <header className="border-b border-border bg-surface px-4 py-4 sm:px-8">
          <p className="text-sm text-muted-foreground">
            Signed in as{" "}
            <span className="font-medium text-foreground">
              {profile.full_name ?? user.email}
            </span>
          </p>
        </header>
        <div className="px-4 py-8 sm:px-8">{children}</div>
      </div>
    </div>
  );
}
