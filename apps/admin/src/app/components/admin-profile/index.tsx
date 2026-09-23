"use client";

import Image from "next/image";
import CardBox from "../shared/CardBox";
import { Icon } from "@iconify/react/dist/iconify.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCallback, useEffect, useState } from "react";
import BreadcrumbComp from "@/app/(DashboardLayout)/layout/shared/breadcrumb/BreadcrumbComp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_AVATAR,
  getCachedAvatar,
  resolveAvatarUrl,
  setCachedAdminMeta,
  setCachedAvatar,
} from "@/lib/admin-avatar";

type ModalType = "personal" | "address" | "account" | null;

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  location: string | null;
  state: string | null;
  zip: string | null;
  avatarUrl: string | null;
  role: string;
};

function splitName(name: string | null | undefined) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  };
}

const AdminProfile = () => {
  const [openModal, setOpenModal] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [personal, setPersonal] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [address, setAddress] = useState({
    location: "",
    state: "",
    zip: "",
  });

  const [tempPersonal, setTempPersonal] = useState(personal);
  const [tempAddress, setTempAddress] = useState(address);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const BCrumb = [
    { to: "/", title: "Home" },
    { title: "Admin Profile" },
  ];

  const applyUser = useCallback((user: AdminUser) => {
    const { firstName, lastName } = splitName(user.name);
    const nextPersonal = {
      firstName,
      lastName,
      email: user.email || "",
      phone: user.phone || "",
    };
    const nextAddress = {
      location: user.location || "",
      state: user.state || "",
      zip: user.zip || "",
    };
    const nextAvatar = resolveAvatarUrl(user.avatarUrl);
    setPersonal(nextPersonal);
    setAddress(nextAddress);
    setTempPersonal(nextPersonal);
    setTempAddress(nextAddress);
    setAvatarUrl(nextAvatar);
    setCachedAvatar(nextAvatar);
    setCachedAdminMeta(user.name, user.email);
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    const cached = getCachedAvatar();
    if (cached) setAvatarUrl(cached);
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to load profile");
        if (!cached) setAvatarUrl(DEFAULT_AVATAR);
        return;
      }
      applyUser(data as AdminUser);
    } catch {
      setError("Failed to load profile");
      if (!getCachedAvatar()) setAvatarUrl(DEFAULT_AVATAR);
    } finally {
      setLoading(false);
    }
  }, [applyUser]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!openModal) return;
    if (modalType === "personal") setTempPersonal(personal);
    if (modalType === "address") setTempAddress(address);
    if (modalType === "account") {
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTempPersonal(personal);
    }
    setMessage("");
    setError("");
  }, [openModal, modalType, personal, address]);

  async function handleSave() {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (modalType === "personal" || modalType === "address") {
        const payload =
          modalType === "personal"
            ? {
                name: `${tempPersonal.firstName} ${tempPersonal.lastName}`.trim(),
                email: tempPersonal.email,
                phone: tempPersonal.phone,
              }
            : {
                location: tempAddress.location,
                state: tempAddress.state,
                zip: tempAddress.zip,
              };

        const res = await fetch("/api/auth/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(
            Array.isArray(data.message)
              ? data.message.join(", ")
              : data.message || "Failed to save",
          );
          return;
        }
        applyUser(data as AdminUser);
        setMessage("Profile updated");
        setOpenModal(false);
      }

      if (modalType === "account") {
        if (tempPersonal.email !== personal.email) {
          const res = await fetch("/api/auth/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: tempPersonal.email }),
          });
          const data = await res.json();
          if (!res.ok) {
            setError(
              Array.isArray(data.message)
                ? data.message.join(", ")
                : data.message || "Failed to update email",
            );
            return;
          }
          applyUser(data as AdminUser);
        }

        const wantsPasswordChange =
          passwordForm.currentPassword ||
          passwordForm.newPassword ||
          passwordForm.confirmPassword;

        if (wantsPasswordChange) {
          if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError("New password and confirm password do not match");
            return;
          }
          const res = await fetch("/api/auth/password", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              currentPassword: passwordForm.currentPassword,
              newPassword: passwordForm.newPassword,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            setError(
              Array.isArray(data.message)
                ? data.message.join(", ")
                : data.message || "Failed to change password",
            );
            return;
          }
          setMessage("Email / password updated");
        } else {
          setMessage("Email updated");
        }
        setOpenModal(false);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingAvatar(true);
    setError("");
    setMessage("");

    try {
      const form = new FormData();
      form.append("avatar", file);
      const res = await fetch("/api/auth/avatar", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Failed to upload image",
        );
        return;
      }
      applyUser(data as AdminUser);
      setMessage("Profile image updated");
    } catch {
      setError("Failed to upload image");
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <>
      <BreadcrumbComp title="Admin Profile" items={BCrumb} />
      <div className="flex flex-col gap-6">
        {message ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>
        ) : null}
        {error && !openModal ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}

        <CardBox className="p-6 bg-background overflow-hidden border-none rounded-3xl">
          <div className="flex flex-col sm:flex-row items-center gap-6 rounded-xl relative w-full break-words">
            <div className="relative group">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profile"
                  width={80}
                  height={80}
                  className="rounded-full object-cover h-20 w-20"
                  unoptimized
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gray-200 dark:bg-white/10 animate-pulse" />
              )}
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                title="Change profile image"
              >
                <Icon icon="ic:outline-photo-camera" width="22" height="22" className="text-white" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={uploadingAvatar || loading}
                onChange={handleAvatarChange}
              />
              {uploadingAvatar ? (
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[11px] text-gray-500 whitespace-nowrap">
                  Uploading...
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-4 justify-center sm:justify-between items-center w-full">
              <div className="flex flex-col sm:text-left text-center gap-1.5">
                <h5 className="card-title">
                  {loading
                    ? "Loading..."
                    : `${personal.firstName} ${personal.lastName}`.trim() ||
                      "Admin User"}
                </h5>
                <div className="flex flex-wrap items-center gap-1 md:gap-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {personal.email || "—"}
                  </p>
                  {address.location ? (
                    <>
                      <div className="hidden h-4 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {address.location}
                      </p>
                    </>
                  ) : null}
                </div>
                <div className="pt-1">
                  <label
                    htmlFor="avatar-upload"
                    className="inline-flex h-8 items-center px-3 text-xs rounded-md bg-[#e53935] hover:bg-[#c22028] text-white cursor-pointer"
                  >
                    {uploadingAvatar ? "Uploading..." : "Change Photo"}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </CardBox>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-6 rounded-3xl bg-background md:p-6 p-4 relative w-full break-words">
            <h5 className="card-title">Personal Information</h5>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="text-xs text-gray-500">First Name</p>
                <p>{personal.firstName || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last Name</p>
                <p>{personal.lastName || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p>{personal.phone || "—"}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setModalType("personal");
                  setOpenModal(true);
                }}
                className="flex items-center gap-1.5 rounded-md bg-[#e53935] hover:bg-[#c22028] text-white transition-all shadow-sm"
              >
                <Icon icon="ic:outline-edit" width="18" height="18" />
                Edit
              </Button>
            </div>
          </div>

          <div className="space-y-6 rounded-3xl bg-background md:p-6 p-4 relative w-full break-words">
            <h5 className="card-title">Address Details</h5>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="text-xs text-gray-500">Location</p>
                <p>{address.location || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Province / State</p>
                <p>{address.state || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">ZIP</p>
                <p>{address.zip || "—"}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setModalType("address");
                  setOpenModal(true);
                }}
                className="flex items-center gap-1.5 rounded-md bg-[#e53935] hover:bg-[#c22028] text-white transition-all shadow-sm"
              >
                <Icon icon="ic:outline-edit" width="18" height="18" /> Edit
              </Button>
            </div>
          </div>

          <div className="space-y-6 rounded-3xl bg-background md:p-6 p-4 relative w-full break-words xl:col-span-2">
            <h5 className="card-title">Account Security</h5>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="text-xs text-gray-500">User Email</p>
                <p>{personal.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Password</p>
                <p>••••••••</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setModalType("account");
                  setOpenModal(true);
                }}
                className="flex items-center gap-1.5 rounded-md bg-[#e53935] hover:bg-[#c22028] text-white transition-all shadow-sm"
              >
                <Icon icon="ic:outline-edit" width="18" height="18" />
                Change Email / Password
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="mb-4">
              {modalType === "personal"
                ? "Edit Personal Information"
                : modalType === "address"
                  ? "Edit Address Details"
                  : "Change Email / Password"}
            </DialogTitle>
          </DialogHeader>

          {modalType === "personal" ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={tempPersonal.firstName}
                  onChange={(e) =>
                    setTempPersonal({
                      ...tempPersonal,
                      firstName: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={tempPersonal.lastName}
                  onChange={(e) =>
                    setTempPersonal({
                      ...tempPersonal,
                      lastName: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-2 lg:col-span-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={tempPersonal.phone}
                  onChange={(e) =>
                    setTempPersonal({ ...tempPersonal, phone: e.target.value })
                  }
                />
              </div>
            </div>
          ) : null}

          {modalType === "address" ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={tempAddress.location}
                  onChange={(e) =>
                    setTempAddress({ ...tempAddress, location: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="state">Province / State</Label>
                <Input
                  id="state"
                  value={tempAddress.state}
                  onChange={(e) =>
                    setTempAddress({ ...tempAddress, state: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-2 lg:col-span-2">
                <Label htmlFor="zip">ZIP</Label>
                <Input
                  id="zip"
                  value={tempAddress.zip}
                  onChange={(e) =>
                    setTempAddress({ ...tempAddress, zip: e.target.value })
                  }
                />
              </div>
            </div>
          ) : null}

          {modalType === "account" ? (
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="accountEmail">User Email</Label>
                <Input
                  id="accountEmail"
                  type="email"
                  value={tempPersonal.email}
                  onChange={(e) =>
                    setTempPersonal({ ...tempPersonal, email: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                />
              </div>
              <p className="text-xs text-gray-500">
                Leave password fields empty if you only want to update email.
              </p>
            </div>
          ) : null}

          {error && openModal ? (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>
          ) : null}

          <DialogFooter className="flex gap-2 mt-4">
            <Button
              className="rounded-md"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              className="rounded-md bg-lighterror dark:bg-darkerror text-error hover:bg-error hover:text-white"
              onClick={() => setOpenModal(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminProfile;
