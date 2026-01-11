"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ResponsiveImageContainer } from "@/components/ResponsiveImage";
import MediaCard from "@/components/admin/MediaCard";
import MediaViewModal from "@/components/admin/MediaViewModal";
import VideoUploader from "@/components/admin/VideoUploader";
import VideoLinker from "@/components/admin/VideoLinker";
import type { Media, MediaWithUsage, MediaUsageDetails } from "@/types/media";

interface MediaResponse {
  success: boolean;
  data?: {
    items: MediaWithUsage[];
    total: number;
    limit: number;
    offset: number;
  };
  error?: string;
}

type ViewMode = "grid" | "table";
type SortField = "created_at" | "filename" | "alt";
type SortDirection = "asc" | "desc";

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<MediaWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [usageFilter, setUsageFilter] = useState<"all" | "in_use" | "orphaned">("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<MediaWithUsage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [usageModal, setUsageModal] = useState<MediaWithUsage | null>(null);
  const [usageDetails, setUsageDetails] = useState<MediaUsageDetails | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [showVideoLink, setShowVideoLink] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [viewingMedia, setViewingMedia] = useState<Media | null>(null);
  const [customerSubdomain, setCustomerSubdomain] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Fetch video config (customer subdomain) on mount
  useEffect(() => {
    async function fetchVideoConfig() {
      try {
        const res = await fetch("/admin/api/video/config");
        const data = (await res.json()) as { success: boolean; data?: { customerSubdomain: string } };
        if (data.success && data.data) {
          setCustomerSubdomain(data.data.customerSubdomain);
        }
      } catch {
        // Silently fail - videos just won't play
      }
    }
    fetchVideoConfig();
  }, []);

  // Close add menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setShowAddMenu(false);
      }
    }
    if (showAddMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showAddMenu]);

  // Table sorting (client-side for current page)
  const [tableSortField, setTableSortField] = useState<SortField>("created_at");
  const [tableSortDir, setTableSortDir] = useState<SortDirection>("desc");

  const limit = 24;

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("limit", limit.toString());
      params.set("offset", (page * limit).toString());
      params.set("sort", sortOrder);
      if (typeFilter) params.set("type", typeFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/admin/api/media?${params.toString()}`);
      const data = (await res.json()) as MediaResponse;

      if (data.success && data.data) {
        setMedia(data.data.items);
        setTotal(data.data.total);
      } else {
        setError(data.error || "Failed to load media");
      }
    } catch {
      setError("Failed to load media");
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, sortOrder, search]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const fetchUsageDetails = async (mediaId: number) => {
    setLoadingUsage(true);
    try {
      const res = await fetch(`/admin/api/media/${mediaId}/usage`);
      const data = (await res.json()) as { success: boolean; data?: MediaUsageDetails };
      if (data.success && data.data) {
        setUsageDetails(data.data);
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingUsage(false);
    }
  };

  const handleShowUsage = (item: MediaWithUsage) => {
    setUsageModal(item);
    setUsageDetails(null);
    fetchUsageDetails(item.id);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/admin/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = (await res.json()) as { success: boolean; error?: string };
        if (!data.success) {
          throw new Error(data.error || "Upload failed");
        }
      }

      setPage(0);
      await fetchMedia();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/admin/api/media/${deleteConfirm.id}`, {
        method: "DELETE",
      });

      const data = (await res.json()) as { success: boolean; error?: string };

      if (data.success) {
        setDeleteConfirm(null);
        await fetchMedia();
      } else {
        setError(data.error || "Delete failed");
      }
    } catch {
      setError("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(0);
  };

  const handleTableSort = (field: SortField) => {
    if (tableSortField === field) {
      setTableSortDir(tableSortDir === "asc" ? "desc" : "asc");
    } else {
      setTableSortField(field);
      setTableSortDir("asc");
    }
  };

  const isInUse = (item: MediaWithUsage) => item.article_count > 0 || item.page_count > 0;

  // Filter media by usage (client-side)
  const filteredMedia = media.filter((item) => {
    if (usageFilter === "in_use") return isInUse(item);
    if (usageFilter === "orphaned") return !isInUse(item);
    return true;
  });

  // Sort media for table view (client-side)
  const sortedMedia = [...filteredMedia].sort((a, b) => {
    let aVal: string | number = "";
    let bVal: string | number = "";

    switch (tableSortField) {
      case "filename":
        aVal = a.filename.toLowerCase();
        bVal = b.filename.toLowerCase();
        break;
      case "alt":
        aVal = (a.alt || "").toLowerCase();
        bVal = (b.alt || "").toLowerCase();
        break;
      case "created_at":
      default:
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
    }

    if (aVal < bVal) return tableSortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return tableSortDir === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              title="Grid view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              title="Table view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Add Media dropdown */}
          <div className="relative" ref={addMenuRef}>
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Add Media"}
              <svg
                className={`w-4 h-4 transition-transform ${showAddMenu ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAddMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={() => {
                    setShowAddMenu(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload Image
                </button>
                <button
                  onClick={() => {
                    setShowAddMenu(false);
                    setShowVideoUpload(true);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Upload Video
                </button>
                <button
                  onClick={() => {
                    setShowAddMenu(false);
                    setShowVideoLink(true);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Add Video
                </button>
              </div>
            )}

            {/* Hidden file input for image upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Type:</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(0);
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Show:</label>
            <select
              value={usageFilter}
              onChange={(e) => setUsageFilter(e.target.value as "all" | "in_use" | "orphaned")}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All</option>
              <option value="in_use">In Use</option>
              <option value="orphaned">Orphaned</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sort:</label>
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value as "desc" | "asc");
                setPage(0);
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>

          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title..."
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Search
            </button>
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setPage(0);
                }}
                className="px-3 py-1.5 text-gray-500 text-sm hover:text-gray-700"
              >
                Clear
              </button>
            )}
          </form>

          <div className="ml-auto text-sm text-gray-500">
            {usageFilter !== "all" ? (
              <>{filteredMedia.length} of {total} {total === 1 ? "item" : "items"}</>
            ) : (
              <>{total} {total === 1 ? "item" : "items"}</>
            )}
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Media display */}
      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500">No media found</p>
          <p className="text-sm text-gray-400 mt-1">
            {usageFilter !== "all" ? "Try changing the filter" : "Upload images or videos to get started"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredMedia.map((item) => (
            <MediaCard
              key={item.id}
              media={item}
              onView={setViewingMedia}
              onEdit={setEditingMedia}
              onDelete={isInUse(item) ? undefined : (m) => setDeleteConfirm(m as MediaWithUsage)}
              inUse={isInUse(item)}
              onShowUsage={() => handleShowUsage(item)}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Thumb
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleTableSort("filename")}
                >
                  <div className="flex items-center gap-1">
                    Filename
                    {tableSortField === "filename" && (
                      <span>{tableSortDir === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleTableSort("alt")}
                >
                  <div className="flex items-center gap-1">
                    Alt Text
                    {tableSortField === "alt" && (
                      <span>{tableSortDir === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleTableSort("created_at")}
                >
                  <div className="flex items-center gap-1">
                    Date
                    {tableSortField === "created_at" && (
                      <span>{tableSortDir === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  In Use
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedMedia.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setViewingMedia(item)}
                      className="w-16 h-12 bg-gray-100 rounded overflow-hidden relative block hover:ring-2 hover:ring-blue-500 transition-all"
                      title="View media"
                    >
                      {item.type === "video" ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      ) : (
                        <ResponsiveImageContainer
                          path={item.path}
                          alt={item.alt || item.title}
                          preset="tableThumb"
                          containerClassName="w-full h-full"
                        />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditingMedia(item)}
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline text-left"
                    >
                      {item.filename}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {item.alt || <span className="text-gray-400 italic">No alt text</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {isInUse(item) ? (
                      <button
                        onClick={() => handleShowUsage(item)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full hover:bg-green-200 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {item.article_count + item.page_count} use{item.article_count + item.page_count !== 1 ? "s" : ""}
                      </button>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(item)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {editingMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Media</h2>
              <EditMediaForm
                media={editingMedia}
                onSave={async () => {
                  setEditingMedia(null);
                  await fetchMedia();
                }}
                onCancel={() => setEditingMedia(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Media?</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete &quot;{deleteConfirm.title}&quot;?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Usage Modal */}
      {usageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Media Usage</h2>
            <p className="text-gray-600 mb-4">
              &quot;{usageModal.title}&quot; is used in:
            </p>

            {loadingUsage ? (
              <div className="flex justify-center py-4">
                <svg className="animate-spin h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : usageDetails ? (
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {usageDetails.articles.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Articles ({usageDetails.articles.length})</h3>
                    <ul className="space-y-1">
                      {usageDetails.articles.map((article) => (
                        <li key={article.id}>
                          <Link
                            href={`/admin/articles/${article.id}/edit`}
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                            onClick={() => setUsageModal(null)}
                          >
                            {article.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {usageDetails.pages.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Pages ({usageDetails.pages.length})</h3>
                    <ul className="space-y-1">
                      {usageDetails.pages.map((page) => (
                        <li key={page.id}>
                          <Link
                            href={`/admin/pages/${page.id}/edit`}
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                            onClick={() => setUsageModal(null)}
                          >
                            {page.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {usageDetails.articles.length === 0 && usageDetails.pages.length === 0 && (
                  <p className="text-gray-500 text-sm">Not currently in use.</p>
                )}
              </div>
            ) : null}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setUsageModal(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Upload Modal */}
      {showVideoUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Video</h2>
            <p className="text-sm text-gray-600 mb-4">
              Videos are uploaded directly to Cloudflare Stream for transcoding and delivery.
            </p>
            <VideoUploader
              onUploadComplete={() => {
                setShowVideoUpload(false);
                setPage(0);
                fetchMedia();
              }}
              onCancel={() => setShowVideoUpload(false)}
            />
          </div>
        </div>
      )}

      {/* Video Link Modal */}
      {showVideoLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Existing Video</h2>
            <p className="text-sm text-gray-600 mb-4">
              Link a video that already exists in your Cloudflare Stream account.
            </p>
            <VideoLinker
              onLinkComplete={() => {
                setShowVideoLink(false);
                setPage(0);
                fetchMedia();
              }}
              onCancel={() => setShowVideoLink(false)}
            />
          </div>
        </div>
      )}

      {/* Media View Modal */}
      {viewingMedia && (() => {
        const currentIndex = filteredMedia.findIndex(m => m.id === viewingMedia.id);
        const hasPrev = currentIndex > 0;
        const hasNext = currentIndex < filteredMedia.length - 1;

        return (
          <MediaViewModal
            media={viewingMedia}
            customerSubdomain={customerSubdomain || undefined}
            onClose={() => setViewingMedia(null)}
            hasPrev={hasPrev}
            hasNext={hasNext}
            onPrev={hasPrev ? () => setViewingMedia(filteredMedia[currentIndex - 1]) : undefined}
            onNext={hasNext ? () => setViewingMedia(filteredMedia[currentIndex + 1]) : undefined}
          />
        );
      })()}
    </div>
  );
}

// Edit form component
function EditMediaForm({
  media,
  onSave,
  onCancel,
}: {
  media: Media;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: media.title,
    alt: media.alt || "",
    lat: media.lat?.toString() || "",
    lon: media.lon?.toString() || "",
    date_taken: media.date_taken ? media.date_taken.split("T")[0] : "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/admin/api/media/${media.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          alt: form.alt || null,
          lat: form.lat ? parseFloat(form.lat) : null,
          lon: form.lon ? parseFloat(form.lon) : null,
          date_taken: form.date_taken || null,
        }),
      });

      const data = (await res.json()) as { success: boolean; error?: string };

      if (data.success) {
        onSave();
      } else {
        setError(data.error || "Save failed");
      }
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
        {media.type === "video" ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <svg className="w-16 h-16 text-white opacity-75" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        ) : (
          <ResponsiveImageContainer
            path={media.path}
            alt={media.alt || media.title}
            preset="mediaPreview"
            containerClassName="w-full h-full"
            objectFit="contain"
          />
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text</label>
        <input
          type="text"
          value={form.alt}
          onChange={(e) => setForm({ ...form, alt: e.target.value })}
          placeholder="Describe the image for accessibility"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
          <input
            type="number"
            step="any"
            value={form.lat}
            onChange={(e) => setForm({ ...form, lat: e.target.value })}
            placeholder="-90 to 90"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
          <input
            type="number"
            step="any"
            value={form.lon}
            onChange={(e) => setForm({ ...form, lon: e.target.value })}
            placeholder="-180 to 180"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date Taken</label>
        <input
          type="date"
          value={form.date_taken}
          onChange={(e) => setForm({ ...form, date_taken: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
        <p><span className="font-medium">Filename:</span> {media.filename}</p>
        <p><span className="font-medium">Type:</span> {media.mime_type}</p>
        {media.width && media.height && (
          <p><span className="font-medium">Dimensions:</span> {media.width} x {media.height}</p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
