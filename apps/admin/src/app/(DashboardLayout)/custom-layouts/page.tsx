"use client";

import { useState, useEffect } from "react";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import { swalError, swalSuccess } from "@/lib/swal";

const SECTION_TYPES = [
  "Topbar",
  "Header",
  "Banner",
  "About",
  "AboutPage",
  "ServicePage",
  "Product",
  "WhyChooseUs",
  "Gallery",
  "GalleryPage",
  "ContactPage",
  "FormDetail",
  "FAQ",
  "Testimonial",
  "Footer",
  "Features",
  "PropertySearch",
  "PropertyGrid",
  "FeaturedDevelopers",
  "CtaBanner",
  "Stats",
  "Team",
  "TeamPage",
  "MissionVision",
  "MissionPage",
  "VisionPage",
  "Breadcrumb",
  "PageBanner",
  "AwardsPage",
  "BlogPage",
  "BlogDetail",
  "BuyPropertyPage",
  "CareerPage",
  "CareerJobs",
  "CareerCta",
  "EnquiryPage",
  "BrochurePage",
  "QuotePage",
  "CsrPage",
  "CsrPrograms",
  "CsrCta",
  "ContactMap",
  "ContactFeatures",
  "PartnerPage",
  "TestimonialPage",
  "PortfolioPage",
  "PropertyPage",
  "PropertyDetail",
  "PricingPage",
  "PricingTable",
  "PricingHelp",
  "FaqPage",
  "IndustriesPage",
  "WhyPartner",
  "SitemapPage",
  "PrivacyPage",
  "TermsPage",
  "PackagePage",
  "ServiceDetail",
];

/** UI labels — Product section is shown as Service */
const SECTION_TYPE_LABELS: Record<string, string> = {
  Product: "Service",
  AboutPage: "About Page",
  ServicePage: "Service Page",
  GalleryPage: "Gallery Page",
  ContactPage: "Contact Page",
  WhyChooseUs: "Why Choose Us",
  FormDetail: "Form Detail",
  PropertySearch: "Property Search",
  PropertyGrid: "Property Grid",
  FeaturedDevelopers: "Featured Developers",
  CtaBanner: "CTA Banner",
  MissionVision: "Mission & Vision",
  PageBanner: "Page Banner",
  PackagePage: "Package Page",
  ServiceDetail: "Service Detail",
};

function sectionTypeLabel(type: string) {
  return SECTION_TYPE_LABELS[type] || type;
}

const SCOPES = ["home", "page"];
const FRONTEND_URL =
  process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

type LayoutRow = {
  _id: string;
  id?: string;
  key: string;
  name: string;
  sectionType: string;
  sectionNumber: number;
  categorySlug?: string | null;
  scope: string;
  order: number;
  status: string;
  thumbnailUrl?: string | null;
  description?: string | null;
  defaultContent?: Record<string, unknown> | null;
};

type CategoryRow = {
  _id: string;
  name: string;
  slug: string;
  status: string;
};

const emptyForm = {
  _id: "",
  key: "",
  name: "",
  sectionType: SECTION_TYPES[0],
  sectionNumber: 1,
  categorySlug: "realestate",
  scope: "home",
  order: 1,
  status: "Active",
  thumbnailUrl: "",
  description: "",
};

const CustomLayoutsPage = () => {
  const [layouts, setLayouts] = useState<LayoutRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState<LayoutRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [isSectionOpen, setIsSectionOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isScopeOpen, setIsScopeOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [previewLayout, setPreviewLayout] = useState<LayoutRow | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [variantFilter, setVariantFilter] = useState("all");

  const [formData, setFormData] = useState(emptyForm);
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);

  const resolveThumbSrc = (src?: string | null) => {
    if (!src?.trim()) return "";
    if (/^https?:\/\//i.test(src) || src.startsWith("data:")) return src;
    if (src.startsWith("/")) return `${FRONTEND_URL}${src}`;
    return src;
  };

  const uploadThumbnail = async (file: File) => {
    setIsUploadingThumb(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("category", formData.categorySlug || "layouts");
      const res = await fetch("/api/contents/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await swalError(data.message || "Thumbnail upload failed");
        return;
      }
      setFormData((prev) => ({
        ...prev,
        thumbnailUrl: (data.url as string) || "",
      }));
    } catch {
      await swalError("Thumbnail upload failed");
    } finally {
      setIsUploadingThumb(false);
    }
  };

  const previewUrl = previewLayout
    ? `${FRONTEND_URL}/preview/layout/${encodeURIComponent(previewLayout.key)}${
        previewLayout.categorySlug
          ? `?category=${encodeURIComponent(
              categories.find(
                (category) => category.slug === previewLayout.categorySlug,
              )?.name || previewLayout.categorySlug,
            )}`
          : ""
      }`
    : null;

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [res, categoriesRes] = await Promise.all([
        fetch("/api/layouts"),
        fetch("/api/categories"),
      ]);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        await swalError(err.error || "Failed to load layouts");
        return;
      }
      const data = await res.json();
      setLayouts(Array.isArray(data) ? data : []);
      if (categoriesRes.ok) {
        const categoryData = await categoriesRes.json();
        setCategories(
          Array.isArray(categoryData)
            ? categoryData.filter(
                (category: CategoryRow) => category.status === "Active",
              )
            : [],
        );
      }
    } catch (error) {
      console.error("Error fetching layouts:", error);
      await swalError("Failed to load layouts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const openAddModal = () => {
    setFormData({ 
      ...emptyForm,
      order: layouts.length + 1,
    });
    setIsEditing(false);
    setIsModalOpen(true);
    setIsSectionOpen(false);
    setIsCategoryOpen(false);
    setIsScopeOpen(false);
    setIsStatusOpen(false);
  };

  const openEditModal = (layout: LayoutRow) => {
    setFormData({
      _id: layout._id || layout.id || "",
      key: layout.key,
      name: layout.name,
      sectionType: layout.sectionType,
      sectionNumber: layout.sectionNumber ?? 1,
      categorySlug: layout.categorySlug || "",
      scope: layout.scope || "home",
      order: layout.order ?? 1,
      status: layout.status || "Active",
      thumbnailUrl: layout.thumbnailUrl || "",
      description: layout.description || "",
    });
    setIsEditing(true);
    setIsModalOpen(true);
    setIsSectionOpen(false);
    setIsCategoryOpen(false);
    setIsScopeOpen(false);
    setIsStatusOpen(false);
  };

  const openDeleteModal = (layout: LayoutRow) => {
    setSelectedLayout(layout);
    setIsDeleteOpen(true);
  };

  const handleKeyFromName = (name: string, sectionType: string, sectionNumber: number) => {
    // Prefer registry-style key: SectionType-N
    if (sectionType && sectionNumber) {
      return `${sectionType}-${sectionNumber}`;
    }
    return name
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^A-Za-z0-9-]/g, "");
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.key.trim() || !formData.sectionType.trim()) {
      await swalError("Key, name, and section type are required");
      return;
    }

    setIsSaving(true);
    try {
      const method = isEditing ? "PUT" : "POST";
      const payload = {
        ...(isEditing ? { _id: formData._id } : {}),
        key: formData.key.trim(),
        name: formData.name.trim(),
        sectionType: formData.sectionType,
        sectionNumber: Number(formData.sectionNumber) || 1,
        categorySlug: formData.categorySlug || null,
        scope: formData.scope,
        order: Number(formData.order) || 1,
        status: formData.status,
        thumbnailUrl: formData.thumbnailUrl.trim() || null,
        description: formData.description.trim() || null,
      };

      const res = await fetch("/api/layouts", {
        method, 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await swalError(data.error || data.message || "Failed to save layout");
        return;
      }

      await swalSuccess(
        isEditing ? "Layout updated" : "Layout created",
      );
      setIsModalOpen(false);
      await fetchAllData();
    } catch (error) { 
      console.error("Error saving layout:", error); 
      await swalError("Failed to save layout");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedLayout) return;
    const id = selectedLayout._id || selectedLayout.id;
    try {
      const res = await fetch(`/api/layouts?id=${encodeURIComponent(id!)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await swalError(data.error || "Failed to delete layout");
        return;
      }
      await swalSuccess("Layout deleted");
    setIsDeleteOpen(false);
      setSelectedLayout(null);
      await fetchAllData();
    } catch (error) {
      console.error("Error deleting layout:", error);
      await swalError("Failed to delete layout");
    }
  };

  const visibleLayouts = layouts.filter((layout) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      layout.key.toLowerCase().includes(q) ||
      layout.name.toLowerCase().includes(q) ||
      layout.sectionType.toLowerCase().includes(q);
    const matchesVariant =
      variantFilter === "all" ||
      String(layout.sectionNumber) === variantFilter ||
      layout.key.endsWith(`-${variantFilter}`);
    return matchesSearch && matchesVariant;
  });

  return (
    <>
      <CardBox className="bg-white dark:bg-[#0b0b0b]/80 backdrop-blur-xl border border-gray-100 dark:border-white/5 rounded-2xl p-0 overflow-hidden relative flex flex-col h-[calc(100vh-120px)]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-white/5 shrink-0 bg-white dark:bg-[#0b0b0b] z-30">
          <div>
            <h5 className="text-[18px] font-bold text-gray-800 dark:text-white">
              Custom Layouts
            </h5>
            <p className="text-[12px] text-gray-500 mt-0.5">
              Manage section variants (registry key, scope, thumbnail).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search key or name (e.g. T4, PropertySearch-4)"
              className="w-64 bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-white/10 rounded-full px-4 py-2 text-[13px] text-gray-800 dark:text-white focus:outline-none focus:border-[#e53935]"
            />
            <select
              value={variantFilter}
              onChange={(e) => setVariantFilter(e.target.value)}
              className="appearance-none bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-white/10 rounded-full pl-4 pr-8 py-2 text-[13px] font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#e53935]"
            >
              <option value="all">All variants</option>
              <option value="4">Template 4</option>
              <option value="5">Variant 5</option>
              <option value="6">Variant 6</option>
            </select>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-[#e53935] hover:bg-[#c22028] text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-[0_0_15px_rgba(229,57,53,0.3)]"
          >
            <Icon icon="solar:document-add-bold-duotone" width={18} /> Add Layout
          </button>
          </div>
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
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    #
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Key
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Section
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Scope
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5 relative z-10">
                {visibleLayouts.length > 0 ? (
                  visibleLayouts.map((layout, index) => (
                    <tr
                      key={layout._id || layout.key}
                      className="hover:bg-gray-50 dark:hover:bg-white/5 group transition-colors"
                    >
                      <td className="py-4 px-6 text-[14px] font-bold text-gray-700 dark:text-gray-300">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <code className="text-[13px] font-semibold text-[#e53935] bg-red-50 dark:bg-[#e53935]/10 px-2 py-1 rounded-md">
                          {layout.key}
                        </code>
                      </td>
                      <td className="py-4 px-6 text-[14px] font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        {layout.name}
                      </td>
                      <td className="py-4 px-6">
                        <span className="bg-gray-100 dark:bg-white/10 px-2.5 py-1 rounded-md text-[12px] font-semibold text-gray-700 dark:text-gray-300">
                          {sectionTypeLabel(layout.sectionType)}
                          {layout.sectionNumber ? ` · ${layout.sectionNumber}` : ""}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-[13px] font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {categories.find(
                          (category) => category.slug === layout.categorySlug,
                        )?.name || layout.categorySlug || "—"}
                      </td>
                      <td className="py-4 px-6 text-[13px] font-medium text-gray-600 dark:text-gray-400 capitalize">
                        {layout.scope}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase ${
                            layout.status === "Active"
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500"
                              : "bg-red-50 text-red-600 dark:bg-[#e53935]/10 dark:text-[#e53935]"
                          }`}
                        >
                          {layout.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3 text-gray-400">
                          <button
                            onClick={() => setPreviewLayout(layout)}
                            className="w-8 h-8 rounded-lg hover:bg-sky-50 hover:text-sky-500 dark:hover:bg-sky-500/15 flex items-center justify-center transition-all"
                            title="Preview"
                          >
                            <Icon icon="solar:eye-bold-duotone" width={18} />
                          </button>
                          <button
                            onClick={() => openEditModal(layout)}
                            className="w-8 h-8 rounded-lg hover:bg-emerald-50 hover:text-emerald-500 dark:hover:bg-emerald-500/15 flex items-center justify-center transition-all"
                            title="Edit"
                          >
                            <Icon icon="solar:pen-bold-duotone" width={18} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(layout)}
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
                    <td colSpan={8} className="py-12 text-center">
                      <Icon
                        icon="solar:widget-2-bold-duotone"
                        width={48}
                        className="mx-auto text-gray-300 dark:text-gray-600 mb-3"
                      />
                      <p className="text-[14px] font-semibold text-gray-500 dark:text-gray-400">
                        No layouts found.
                      </p>
                      <p className="text-[12px] text-gray-400 mt-1">
                        Run: npm run db:seed:layouts
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#171717] w-full max-w-lg rounded-2xl border border-gray-100 dark:border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-white/5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {isEditing ? "Edit Layout" : "Add Layout"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-[#e53935]"
              >
                <Icon icon="solar:close-circle-bold" width={24} />
              </button>
            </div>
            
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[13px] font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        name,
                        key: isEditing
                          ? prev.key
                          : handleKeyFromName(
                              name,
                              prev.sectionType,
                              prev.sectionNumber,
                            ),
                      }));
                    }}
                    placeholder="e.g. Header 1"
                    className="w-full bg-gray-50 dark:bg-[#0b0b0b] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white focus:outline-none focus:border-[#e53935]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({ ...formData, order: Number(e.target.value) })
                    }
                    className="w-full bg-gray-50 dark:bg-[#0b0b0b] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white focus:outline-none focus:border-[#e53935]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                  Registry key
                </label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) =>
                    setFormData({ ...formData, key: e.target.value })
                  }
                  placeholder="Header-1"
                  className="w-full bg-gray-50 dark:bg-[#0b0b0b] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-[14px] font-mono text-gray-900 dark:text-white focus:outline-none focus:border-[#e53935]"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Must match frontend sectionRegistry (e.g. Banner-2)
                </p>
              </div>

              <div className="relative">
                <label className="mb-1.5 block text-[13px] font-semibold text-gray-600 dark:text-gray-300">
                  Category
                </label>
                {isCategoryOpen && (
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsCategoryOpen(false)}
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryOpen(!isCategoryOpen);
                    setIsSectionOpen(false);
                    setIsScopeOpen(false);
                    setIsStatusOpen(false);
                  }}
                  className={`relative z-40 flex w-full items-center justify-between rounded-xl border bg-gray-50 px-4 py-2.5 text-left text-[14px] dark:bg-[#0b0b0b] ${
                    isCategoryOpen
                      ? "border-[#e53935]"
                      : "border-gray-200 dark:border-white/10"
                  }`}
                >
                  <span className="truncate text-gray-900 dark:text-white">
                    {categories.find(
                      (category) => category.slug === formData.categorySlug,
                    )?.name || "Select category"}
                  </span>
                  <Icon
                    icon="solar:alt-arrow-down-bold"
                    width={14}
                    className="text-gray-400"
                  />
                </button>
                {isCategoryOpen && (
                  <div className="absolute z-50 mt-1.5 max-h-48 w-full overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-xl dark:border-white/10 dark:bg-[#1f1f1f]">
                    {categories.map((category) => (
                      <button
                        type="button"
                        key={category._id || category.slug}
                        onClick={() => {
                          setFormData((current) => ({
                            ...current,
                            categorySlug: category.slug,
                          }));
                          setIsCategoryOpen(false);
                        }}
                        className={`block w-full px-4 py-2.5 text-left text-[13.5px] hover:bg-gray-50 dark:hover:bg-white/5 ${
                          formData.categorySlug === category.slug
                            ? "font-bold text-[#e53935]"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-[11px] text-gray-400">
                  Choose Realestate or Event Services. Layouts are never shared across all categories.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-[13px] font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    Section type
                  </label>
                  {isSectionOpen && (
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsSectionOpen(false)}
                    />
                  )}
                  <div
                    onClick={() => {
                      setIsSectionOpen(!isSectionOpen);
                      setIsCategoryOpen(false);
                      setIsScopeOpen(false);
                      setIsStatusOpen(false);
                    }}
                    className={`relative z-40 flex items-center justify-between w-full bg-gray-50 dark:bg-[#0b0b0b] border ${
                      isSectionOpen
                        ? "border-[#e53935]"
                        : "border-gray-200 dark:border-white/10"
                    } rounded-xl px-4 py-2.5 text-[14px] cursor-pointer`}
                  >
                    <span className="text-gray-900 dark:text-white truncate">
                      {sectionTypeLabel(formData.sectionType)}
                    </span>
                    <Icon
                      icon="solar:alt-arrow-down-bold"
                      width={14}
                      className="text-gray-400"
                    />
                  </div>
                  {isSectionOpen && (
                    <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-[#1f1f1f] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl overflow-y-auto max-h-48">
                      {SECTION_TYPES.map((sec) => (
                        <div
                          key={sec}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              sectionType: sec,
                              name: isEditing
                                ? prev.name
                                : `${sectionTypeLabel(sec)} ${prev.sectionNumber || 1}`,
                              key: isEditing
                                ? prev.key
                                : handleKeyFromName(
                                    prev.name,
                                    sec,
                                    prev.sectionNumber,
                                  ),
                            }));
                            setIsSectionOpen(false);
                          }}
                          className={`px-4 py-2.5 text-[13.5px] cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 ${
                            formData.sectionType === sec
                              ? "text-[#e53935] font-bold"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {sectionTypeLabel(sec)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    Section number
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.sectionNumber}
                    onChange={(e) => {
                      const sectionNumber = Number(e.target.value) || 1;
                      setFormData((prev) => ({
                        ...prev,
                        sectionNumber,
                        key: isEditing
                          ? prev.key
                          : handleKeyFromName(
                              prev.name,
                              prev.sectionType,
                              sectionNumber,
                            ),
                      }));
                    }}
                    className="w-full bg-gray-50 dark:bg-[#0b0b0b] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white focus:outline-none focus:border-[#e53935]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-[13px] font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    Scope
                  </label>
                  {isScopeOpen && (
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsScopeOpen(false)}
                    />
                  )}
                  <div
                    onClick={() => {
                      setIsScopeOpen(!isScopeOpen);
                      setIsSectionOpen(false);
                      setIsCategoryOpen(false);
                      setIsStatusOpen(false);
                    }}
                    className={`relative z-40 flex items-center justify-between w-full bg-gray-50 dark:bg-[#0b0b0b] border ${
                      isScopeOpen
                        ? "border-[#e53935]"
                        : "border-gray-200 dark:border-white/10"
                    } rounded-xl px-4 py-2.5 text-[14px] cursor-pointer capitalize`}
                  >
                    <span className="text-gray-900 dark:text-white">
                      {formData.scope}
                    </span>
                    <Icon
                      icon="solar:alt-arrow-down-bold"
                      width={14}
                      className="text-gray-400"
                    />
                  </div>
                  {isScopeOpen && (
                    <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-[#1f1f1f] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl overflow-hidden">
                      {SCOPES.map((scope) => (
                        <div
                          key={scope}
                          onClick={() => {
                            setFormData({ ...formData, scope });
                            setIsScopeOpen(false);
                          }}
                          className="px-4 py-2.5 text-[13.5px] cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 capitalize"
                        >
                          {scope}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label className="block text-[13px] font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    Status
                  </label>
                  {isStatusOpen && (
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsStatusOpen(false)}
                    />
                  )}
                  <div
                    onClick={() => {
                      setIsStatusOpen(!isStatusOpen);
                      setIsSectionOpen(false);
                      setIsCategoryOpen(false);
                      setIsScopeOpen(false);
                    }}
                    className={`relative z-40 flex items-center justify-between w-full bg-gray-50 dark:bg-[#0b0b0b] border ${
                      isStatusOpen
                        ? "border-[#e53935]"
                        : "border-gray-200 dark:border-white/10"
                    } rounded-xl px-4 py-2.5 text-[14px] cursor-pointer`}
                  >
                    <span className="text-gray-900 dark:text-white">
                      {formData.status}
                    </span>
                    <Icon
                      icon="solar:alt-arrow-down-bold"
                      width={14}
                      className="text-gray-400"
                    />
                  </div>
                  {isStatusOpen && (
                    <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-[#1f1f1f] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl overflow-hidden">
                      {["Active", "Inactive"].map((status) => (
                        <div
                          key={status}
                          onClick={() => {
                            setFormData({ ...formData, status });
                            setIsStatusOpen(false);
                          }}
                          className="px-4 py-2.5 text-[13.5px] cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
                        >
                          {status}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                  Thumbnail image{" "}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <div className="flex gap-3 items-start rounded-xl border border-gray-200 dark:border-white/10 p-3 bg-gray-50 dark:bg-[#0b0b0b]">
                  <div className="w-28 h-20 rounded-lg overflow-hidden bg-white dark:bg-white/5 shrink-0 flex items-center justify-center border border-gray-100 dark:border-white/5">
                    {formData.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolveThumbSrc(formData.thumbnailUrl)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon
                        icon="solar:gallery-bold-duotone"
                        className="text-gray-400"
                        width={22}
                      />
                    )}
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <input
                      type="text"
                      value={formData.thumbnailUrl}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          thumbnailUrl: e.target.value,
                        })
                      }
                      placeholder="/uploads/... or image URL"
                      className="w-full bg-white dark:bg-[#171717] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-[12px] font-mono text-gray-900 dark:text-white focus:outline-none focus:border-[#e53935]"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex cursor-pointer px-3 py-1.5 rounded-lg text-[12px] font-bold bg-[#e53935] text-white hover:bg-[#c22028]">
                        {isUploadingThumb ? "Uploading…" : "Upload image"}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          className="hidden"
                          disabled={isUploadingThumb}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void uploadThumbnail(file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      {formData.thumbnailUrl ? (
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, thumbnailUrl: "" })
                          }
                          className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10"
                        >
                          Remove
                        </button>
                      ) : null}
                        </div>
                    <p className="text-[11px] text-gray-400">
                      Used in editor layout picker preview. Leave empty if not needed.
                    </p>
                  </div>
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
                  rows={2}
                  className="w-full bg-gray-50 dark:bg-[#0b0b0b] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-white focus:outline-none focus:border-[#e53935] resize-none"
                  placeholder="Optional notes"
                />
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3 bg-gray-50 dark:bg-white/[0.02] rounded-b-2xl">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#e53935] hover:bg-[#c22028] disabled:opacity-50 text-white shadow-lg transition-all"
              >
                {isSaving ? "Saving..." : isEditing ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewLayout && previewUrl && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-6">
          <div className="bg-white dark:bg-[#171717] w-full max-w-6xl h-[90vh] flex flex-col rounded-2xl border border-gray-100 dark:border-white/10 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center gap-3 p-4 border-b border-gray-100 dark:border-white/5 shrink-0">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
                  {previewLayout.name}
                </h3>
                <p className="text-[12px] text-gray-500 font-mono truncate">
                  {previewLayout.key}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
                >
                  <Icon icon="solar:square-top-down-bold-duotone" width={16} />
                  Open tab
                </a>
                <button
                  onClick={() => setPreviewLayout(null)}
                  className="text-gray-400 hover:text-[#e53935]"
                  title="Close"
                >
                  <Icon icon="solar:close-circle-bold" width={26} />
                </button>
              </div>
            </div>
            <iframe
              title={`Preview ${previewLayout.key}`}
              src={previewUrl}
              className="w-full flex-1 bg-white border-0"
            />
          </div>
        </div>
      )}

      {isDeleteOpen && selectedLayout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#171717] w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl">
            <Icon
              icon="solar:trash-bin-trash-bold-duotone"
              className="text-[#e53935] mx-auto text-5xl mb-4"
            />
            <h3 className="text-xl font-bold dark:text-white mb-2">
              Delete Layout?
            </h3>
            <p className="text-sm text-gray-500 mb-1">{selectedLayout.name}</p>
            <p className="text-xs text-gray-400 font-mono mb-4">
              {selectedLayout.key}
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/10 font-bold dark:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl bg-[#e53935] text-white font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomLayoutsPage;
