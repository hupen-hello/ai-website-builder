"use client";

import { useState, useEffect } from "react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import { toIconifyName } from "@/lib/category-icon";
import { swalError, swalSuccess } from "@/lib/swal";

const CategoriesPage = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    _id: "",
    order: 1,
    name: "",
    slug: "",
    icon: "",
    description: "",
    status: "Active",
  });

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const catRes = await fetch("/api/categories");
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const generateSlug = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFormData({ ...formData, name: newName, slug: generateSlug(newName) });
  };

  const openAddModal = () => {
    setFormData({
      _id: "",
      order: categories.length + 1,
      name: "",
      slug: "",
      icon: "",
      description: "",
      status: "Active",
    });
    setIsEditing(false);
    setIsModalOpen(true);
    setIsStatusDropdownOpen(false);
  };

  const openEditModal = (category: any) => {
    setFormData({
      _id: category._id,
      order: category.order,
      name: category.name,
      slug: category.slug,
      icon: category.icon || "",
      description: category.description || "",
      status: category.status || "Active",
    });
    setIsEditing(true);
    setIsModalOpen(true);
    setIsStatusDropdownOpen(false);
  };

  const openDeleteModal = (category: any) => {
    setSelectedCategory(category);
    setIsDeleteOpen(true);
  };

  const previewIcon = toIconifyName(formData.icon);

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    const payload = {
      ...formData,
      icon: toIconifyName(formData.icon) || formData.icon.trim(),
    };

    try {
      if (isEditing) {
        const res = await fetch("/api/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          await swalError(
            Array.isArray(data.error)
              ? data.error.join(", ")
              : data.error || data.message || "Failed to update category.",
          );
          return;
        }

        setCategories(
          categories
            .map((cat) => (cat._id === formData._id ? data.category : cat))
            .sort((a, b) => a.order - b.order),
        );
        await swalSuccess("Category updated successfully");
      } else {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          await swalError(
            Array.isArray(data.error)
              ? data.error.join(", ")
              : data.error || data.message || "Failed to create category.",
          );
          return;
        }

        const newList = [...categories, data.category].sort(
          (a, b) => a.order - b.order,
        );
        setCategories(newList);
        await swalSuccess("Category saved successfully");
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving category:", error);
      await swalError("Failed to save category. Is the backend running?");
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/categories?id=${selectedCategory._id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCategories(
          categories.filter((cat) => cat._id !== selectedCategory._id),
        );
        setIsDeleteOpen(false);
        await swalSuccess("Category deleted");
      } else {
        await swalError("Delete failed on server!");
      }
    } catch (error) {
      console.error("Error deleting category", error);
      await swalError("Failed to delete category.");
    }
  };

  return (
    <>
      <CardBox className="bg-white dark:bg-[#0b0b0b]/80 backdrop-blur-xl border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)] rounded-2xl p-0 overflow-hidden relative flex flex-col h-[calc(100vh-120px)]">
        <div className="flex flex-col sm:flex-row justify-between items-center p-6 border-b border-gray-100 dark:border-white/5 gap-4 shrink-0 z-30 bg-white dark:bg-[#0b0b0b]">
          <h5 className="text-[18px] font-bold text-gray-800 dark:text-white">
            Categories
          </h5>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-[#e53935] hover:bg-[#c22028] text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-[0_0_15px_rgba(229,57,53,0.3)]"
          >
            <Icon icon="solar:folder-with-files-bold-duotone" width={18} /> Add
            New Category
          </button>
        </div>

        <div className="overflow-auto w-full flex-1 relative hide-scrollbar">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Icon
                icon="solar:spinner-bold-duotone"
                className="animate-spin text-[#e53935] text-4xl"
              />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-20">
                <tr className="bg-gray-50 dark:bg-[#171717] border-b border-gray-200 dark:border-white/10 shadow-sm">
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Order
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Icon
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Name
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Slug
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-white/5 relative z-10">
                {categories.length > 0 ? (
                  categories.map((category, index) => {
                    const iconName = toIconifyName(category.icon);
                    return (
                      <tr
                        key={category._id}
                        className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                      >
                        <td className="py-4 px-6 text-[13.5px] font-medium text-gray-700 dark:text-gray-300">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {iconName ? (
                            <Icon
                              icon={iconName}
                              width={22}
                              height={22}
                              className="text-gray-700 dark:text-gray-200"
                            />
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-[14px] font-bold text-gray-900 dark:text-white whitespace-nowrap">
                          {category.name}
                        </td>
                        <td className="py-4 px-6 text-[13px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {category.slug}
                        </td>
                        <td className="py-4 px-6 text-[13px] text-gray-600 dark:text-gray-400 max-w-[200px] truncate">
                          {category.description}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase ${
                              category.status === "Active"
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500"
                                : "bg-red-50 text-red-600 dark:bg-[#e53935]/10 dark:text-[#e53935]"
                            }`}
                          >
                            {category.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-3 text-gray-400 dark:text-gray-500">
                            <button
                              onClick={() => openEditModal(category)}
                              className="w-8 h-8 rounded-lg hover:bg-emerald-50 hover:text-emerald-500 dark:hover:bg-emerald-500/15 flex items-center justify-center transition-all"
                              title="Edit"
                            >
                              <Icon icon="solar:pen-bold-duotone" width={18} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(category)}
                              className="w-8 h-8 rounded-lg hover:bg-red-50 hover:text-[#e53935] dark:hover:bg-[#e53935]/15 flex items-center justify-center transition-all"
                              title="Delete"
                            >
                              <Icon
                                icon="solar:trash-bin-trash-bold-duotone"
                                width={18}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <Icon
                        icon="solar:folder-error-bold-duotone"
                        width={48}
                        className="mx-auto text-gray-300 dark:text-gray-600 mb-3"
                      />
                      <p className="text-[14px] font-semibold text-gray-500 dark:text-gray-400">
                        No categories found.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </CardBox>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#171717] w-full max-w-lg rounded-2xl border border-gray-100 dark:border-white/10 shadow-2xl overflow-visible animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-white/5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {isEditing ? "Edit Category" : "Add New Category"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-[#e53935] transition-colors"
              >
                <Icon icon="solar:close-circle-bold" width={24} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[13px] font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    Category name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={handleNameChange}
                    className="w-full bg-gray-50 dark:bg-[#0b0b0b] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white focus:outline-none focus:border-[#e53935]"
                    placeholder="e.g. Corporate Agency"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    Order No.
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        order: Number(e.target.value),
                      })
                    }
                    className="w-full bg-gray-50 dark:bg-[#0b0b0b] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white focus:outline-none focus:border-[#e53935]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                  Icon class
                </label>
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0b0b0b] flex items-center justify-center shrink-0">
                    {previewIcon ? (
                      <Icon
                        icon={previewIcon}
                        width={22}
                        height={22}
                        className="text-gray-800 dark:text-gray-100"
                      />
                    ) : (
                      <Icon
                        icon="lucide:briefcase"
                        width={20}
                        className="text-gray-300"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) =>
                        setFormData({ ...formData, icon: e.target.value })
                      }
                      className="w-full bg-gray-50 dark:bg-[#0b0b0b] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white focus:outline-none focus:border-[#e53935]"
                      placeholder="lucide-briefcase"
                    />
                    <p className="text-[11px] text-gray-500 mt-1.5">
                      Example: lucide-briefcase
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                  Slug (Auto-generated)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slug: generateSlug(e.target.value),
                    })
                  }
                  className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-gray-500 dark:text-gray-400 focus:outline-none focus:border-[#e53935]"
                  placeholder="corporate-agency"
                />
              </div>

              <div className="relative">
                <label className="block text-[13px] font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                  Status
                </label>
                {isStatusDropdownOpen && (
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsStatusDropdownOpen(false)}
                  ></div>
                )}
                <div
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className={`relative z-40 flex items-center justify-between w-full bg-gray-50 dark:bg-[#0b0b0b] border ${
                    isStatusDropdownOpen
                      ? "border-[#e53935]"
                      : "border-gray-200 dark:border-white/10"
                  } rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white cursor-pointer`}
                >
                  <span>{formData.status}</span>
                  <Icon
                    icon={
                      isStatusDropdownOpen
                        ? "solar:alt-arrow-up-bold"
                        : "solar:alt-arrow-down-bold"
                    }
                    width={14}
                    className="text-gray-400 group-hover:text-[#e53935]"
                  />
                </div>
                {isStatusDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-[#1f1f1f] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl overflow-hidden">
                    <div className="py-1">
                      {["Active", "Inactive"].map((status, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setFormData({ ...formData, status });
                            setIsStatusDropdownOpen(false);
                          }}
                          className={`px-4 py-2.5 text-[13.5px] cursor-pointer flex justify-between ${
                            formData.status === status
                              ? "bg-red-50 text-[#e53935] dark:bg-[#e53935]/15 font-semibold"
                              : "hover:bg-gray-50 dark:hover:bg-white/5"
                          }`}
                        >
                          {status}{" "}
                          {formData.status === status && (
                            <Icon icon="solar:check-circle-bold" width={16} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full bg-gray-50 dark:bg-[#0b0b0b] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white focus:outline-none focus:border-[#e53935] resize-none"
                  placeholder="Enter description..."
                ></textarea>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3 bg-gray-50 dark:bg-white/[0.02]">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.name.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#e53935] hover:bg-[#c22028] disabled:opacity-50 text-white shadow-lg"
              >
                {isEditing ? "Update Category" : "Save Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#171717] w-full max-w-sm rounded-3xl border border-gray-100 dark:border-white/10 shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-[#e53935]/15 rounded-full flex items-center justify-center mb-4">
              <Icon
                icon="solar:trash-bin-trash-bold-duotone"
                width={32}
                className="text-[#e53935]"
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Delete Category
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to delete{" "}
              <strong className="text-gray-800 dark:text-gray-200">
                {selectedCategory?.name}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-gray-700 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-[#e53935] hover:bg-[#c22028]"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CategoriesPage;
