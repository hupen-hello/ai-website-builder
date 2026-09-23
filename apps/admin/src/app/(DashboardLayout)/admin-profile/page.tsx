import type { Metadata } from "next";
import AdminProfile from "@/app/components/admin-profile";

export const metadata: Metadata = {
  title: "Admin Profile",
};

export default function AdminProfilePage() {
  return <AdminProfile />;
}
