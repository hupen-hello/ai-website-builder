"use client";

import { useState, useEffect } from "react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";

const CategoryTypesPage = () => {
  const [categoryTypes, setCategoryTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedType, setSelectedType] = useState<any>(null);

  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    _id: "",
    name: "",
    slug: "",
    description: "",
    status: "Active",
  });

  const fetchCategoryTypes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/category-types");
      if (res.ok) {
        const data = await res.json();
        setCategoryTypes(data);
      }
    } catch (error) {
      console.error("Error fetching category types:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryTypes();
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
      name: "",
      slug: "",
      description: "",
      status: "Active",
    });
    setIsEditing(false);
    setIsModalOpen(true);
    setIsStatusDropdownOpen(false);
  };

  const openEditModal = (typeItem: any) => {
    setFormData(typeItem);
    setIsEditing(true);
    setIsModalOpen(true);
    setIsStatusDropdownOpen(false);
  };

  const openDeleteModal = (typeItem: any) => {
    setSelectedType(typeItem);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    try {
      if (isEditing) {
        const res = await fetch("/api/category-types", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          const { type } = await res.json();
          setCategoryTypes(
            categoryTypes.map((cat) => (cat._id === formData._id ? type : cat)),
          );
        } else {
          alert("Failed to update type.");
        }
      } else {
        const res = await fetch("/api/category-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          const data = await res.json();
          setCategoryTypes([data.type, ...categoryTypes]);
        }
      }
    } catch (error) {
      console.error("Error saving category type:", error);
    }

    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/category-types?id=${selectedType._id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCategoryTypes(
          categoryTypes.filter((cat) => cat._id !== selectedType._id),
        );
      } else {
        alert("Delete failed on server!");
      }
    } catch (error) {
      console.error("Error deleting category type", error);
    }
    setIsDeleteOpen(false);
  };

  return (
    <>
      <CardBox className="bg-white dark:bg-[#0b0b0b]/80 backdrop-blur-xl border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)] rounded-2xl p-0 overflow-hidden relative flex flex-col h-[calc(100vh-120px)]">
        <div className="flex flex-col sm:flex-row justify-between items-center p-6 border-b border-gray-100 dark:border-white/5 gap-4 shrink-0 z-30 bg-white dark:bg-[#0b0b0b]">
          <h5 className="text-[18px] font-bold text-gray-800 dark:text-white">
            Category Types
          </h5>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-[#e53935] hover:bg-[#c22028] text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-[0_0_15px_rgba(229,57,53,0.3)]"
          >
            <Icon icon="solar:layers-minimalistic-bold-duotone" width={18} />
            Add New Type
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
                {categoryTypes.length > 0 ? (
                  categoryTypes.map((type) => (
                    <tr
                      key={type._id || type.id}
                      className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                    >
                      <td className="py-4 px-6 text-[14px] font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        {type.name}
                      </td>
                      <td className="py-4 px-6 text-[13px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {type.slug}
                      </td>
                      <td className="py-4 px-6 text-[13px] text-gray-600 dark:text-gray-400 max-w-[250px] truncate">
                        {type.description}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase ${type.status === "Active" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500" : "bg-red-50 text-red-600 dark:bg-[#e53935]/10 dark:text-[#e53935]"}`}
                        >
                          {type.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3 text-gray-400 dark:text-gray-500">
                          <button
                            onClick={() => openEditModal(type)}
                            className="w-8 h-8 rounded-lg hover:bg-emerald-50 hover:text-emerald-500 dark:hover:bg-emerald-500/15 flex items-center justify-center transition-all"
                            title="Edit"
                          >
                            <Icon icon="solar:pen-bold-duotone" width={18} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(type)}
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
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <Icon
                        icon="solar:folder-error-bold-duotone"
                        width={48}
                        className="mx-auto text-gray-300 dark:text-gray-600 mb-3"
                      />
                      <p className="text-[14px] font-semibold text-gray-500 dark:text-gray-400">
                        No category types found.
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
                {isEditing ? "Edit Category Type" : "Add New Category Type"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-[#e53935] transition-colors"
              >
                <Icon icon="solar:close-circle-bold" width={24} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    Type Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={handleNameChange}
                    className="w-full bg-gray-50 dark:bg-[#0b0b0b] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white focus:outline-none focus:border-[#e53935] transition-colors"
                    placeholder="e.g. Business"
                  />
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
                    className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-gray-500 dark:text-gray-400 focus:outline-none focus:border-[#e53935] transition-colors"
                    placeholder="business"
                  />
                </div>
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
                  className="w-full bg-gray-50 dark:bg-[#0b0b0b] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white focus:outline-none focus:border-[#e53935] resize-none transition-colors"
                  placeholder="Enter type description..."
                ></textarea>
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
                  className={`relative z-40 flex items-center justify-between w-full bg-gray-50 dark:bg-[#0b0b0b] border ${isStatusDropdownOpen ? "border-[#e53935]" : "border-gray-200 dark:border-white/10"} rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white cursor-pointer transition-colors group`}
                >
                  <span>{formData.status}</span>
                  <Icon
                    icon={
                      isStatusDropdownOpen
                        ? "solar:alt-arrow-up-bold"
                        : "solar:alt-arrow-down-bold"
                    }
                    width={14}
                    className="text-gray-400 group-hover:text-[#e53935] transition-colors"
                  />
                </div>
                {isStatusDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-[#1f1f1f] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-1">
                      {["Active", "Inactive"].map((status, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setFormData({ ...formData, status });
                            setIsStatusDropdownOpen(false);
                          }}
                          className={`px-4 py-2.5 text-[13.5px] cursor-pointer transition-colors flex items-center justify-between ${formData.status === status ? "bg-red-50 text-[#e53935] dark:bg-[#e53935]/15 dark:text-[#e53935] font-semibold" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"}`}
                        >
                          {status}
                          {formData.status === status && (
                            <Icon icon="solar:check-circle-bold" width={16} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3 bg-gray-50 dark:bg-white/[0.02]">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.name.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#e53935] hover:bg-[#c22028] disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg transition-colors"
              >
                {isEditing ? "Update Type" : "Save Type"}
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
              Delete Type
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to delete{" "}
              <strong className="text-gray-800 dark:text-gray-200">
                {selectedType?.name}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-[#e53935] hover:bg-[#c22028] shadow-[0_0_15px_rgba(229,57,53,0.3)] transition-colors"
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

export default CategoryTypesPage;
