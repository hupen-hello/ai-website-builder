"use client";

import { useState } from "react";

const getColumnCount = (value: unknown, fallback: number) => {
  const columns =
    typeof value === "number" && Number.isFinite(value)
      ? Math.round(value)
      : fallback;

  return Math.min(6, Math.max(1, columns));
};

export default function useCardPagination({
  itemCount,
  boxesPerRow,
  fallbackColumns,
  rowsPerPage = 2,
}: {
  itemCount: number;
  boxesPerRow: unknown;
  fallbackColumns: number;
  rowsPerPage?: number;
}) {
  const [requestedPage, setRequestedPage] = useState(1);
  const itemsPerPage =
    getColumnCount(boxesPerRow, fallbackColumns) *
    Math.max(1, Math.round(rowsPerPage));
  const totalPages = Math.max(1, Math.ceil(itemCount / itemsPerPage));
  const currentPage = Math.min(requestedPage, totalPages);

  const setCurrentPage = (page: number) => {
    setRequestedPage(Math.min(Math.max(page, 1), totalPages));
  };

  return { currentPage, itemsPerPage, totalPages, setCurrentPage };
}
