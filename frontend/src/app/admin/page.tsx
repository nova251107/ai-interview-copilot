import { currentUser, auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { ShieldAlert, Users, Calendar, BarChart3 } from "lucide-react";
import { getServerHeaders } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
  _count: {
    interviews: number;
    resumes: number;
    roadmaps: number;
  };
}

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const email = user.emailAddresses[0]?.emailAddress;

  // Security Check: Only your email can view this page
  if (email !== "vatsalyagadoya@gmail.com") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-white">
        <ShieldAlert className="mb-4 h-16 w-16 text-red-500" />
        <h1 className="text-3xl font-bold">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">You do not have permission to view the Admin Dashboard.</p>
      </div>
    );
  }

  const authHeaders = await getServerHeaders(auth, {
    id: user.id,
    email,
    name: user.firstName || "Admin",
  });

  // Fetch all users from the new admin route
  const res = await fetch(`${API}/api/admin/users`, {
    headers: {
      ...authHeaders,
      "x-user-email": email || "",
    },
    cache: "no-store",
  });

  const data = await res.json();
  const users = data.success ? data.users : [];

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-muted-foreground">Overview of all registered users and their platform usage.</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-white">
              <thead className="bg-white/5 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Joined At</th>
                  <th className="px-6 py-4 text-center">Interviews</th>
                  <th className="px-6 py-4 text-center">Resumes</th>
                  <th className="px-6 py-4 text-center">Roadmaps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u: AdminUser) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium flex items-center gap-3">
                      {u.image ? (
                        <img src={u.image || undefined} alt={u.name || "User"} className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-violet-500/20" />
                      )}
                      {u.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(u.createdAt), "MMM d, yyyy")}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-violet-500/10 px-2.5 py-0.5 text-violet-400 font-medium">
                        {u._count.interviews}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-blue-400 font-medium">
                        {u._count.resumes}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-amber-400 font-medium">
                        {u._count.roadmaps}
                      </span>
                    </td>
                  </tr>
                ))}
                
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      <BarChart3 className="mx-auto mb-2 h-8 w-8 opacity-50" />
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
