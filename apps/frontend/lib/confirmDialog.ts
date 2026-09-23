import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const START_FRESH_MESSAGE =
  "This will clear your saved business info, template choice, and all editor changes on this device.";

function ensureLestowSwalStyles() {
  const styleId = "swal2-lestow-styles";
  if (typeof document === "undefined") return;

  const existing = document.getElementById(styleId);
  if (existing) existing.remove();

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    .swal2-container {
      z-index: 11000 !important;
      padding: 1rem !important;
    }
    .swal2-container.swal2-backdrop-show {
      background: rgba(15, 23, 42, 0.45) !important;
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
    }
    .swal2-lestow-popup {
      width: min(100%, 420px) !important;
      border-radius: 20px !important;
      padding: 1.85rem 1.6rem 1.4rem !important;
      border: 1px solid rgba(226, 232, 240, 0.95) !important;
      background: #ffffff !important;
      font-family: inherit !important;
      box-shadow:
        0 1px 2px rgba(15, 23, 42, 0.04),
        0 18px 50px rgba(15, 23, 42, 0.18) !important;
    }
    .swal2-lestow-popup .swal2-icon {
      margin: 0.15rem auto 1rem !important;
      border-width: 0 !important;
      width: 3.35rem !important;
      height: 3.35rem !important;
    }
    .swal2-lestow-popup .swal2-icon.swal2-info,
    .swal2-lestow-popup .swal2-icon.swal2-warning,
    .swal2-lestow-popup .swal2-icon.swal2-error,
    .swal2-lestow-popup .swal2-icon.swal2-success,
    .swal2-lestow-popup .swal2-icon.swal2-question {
      border: 0 !important;
    }
    .swal2-lestow-popup .swal2-icon.swal2-info {
      background: #eff6ff !important;
      color: #2563eb !important;
    }
    .swal2-lestow-popup .swal2-icon.swal2-info .swal2-icon-content {
      font-size: 1.65rem !important;
      font-weight: 700 !important;
      color: #2563eb !important;
    }
    .swal2-lestow-popup .swal2-icon.swal2-warning {
      background: #fff7ed !important;
      color: #ea580c !important;
    }
    .swal2-lestow-popup .swal2-icon.swal2-warning .swal2-icon-content {
      font-size: 1.65rem !important;
      font-weight: 700 !important;
      color: #ea580c !important;
    }
    .swal2-lestow-popup .swal2-icon.swal2-error {
      background: #fef2f2 !important;
      color: #dc2626 !important;
    }
    .swal2-lestow-popup .swal2-icon.swal2-error [class^="swal2-x-mark-line"] {
      background-color: #dc2626 !important;
    }
    .swal2-lestow-popup .swal2-icon.swal2-success {
      background: #ecfdf5 !important;
      color: #059669 !important;
      overflow: visible !important;
    }
    .swal2-lestow-popup .swal2-success-circular-line-left,
    .swal2-lestow-popup .swal2-success-circular-line-right,
    .swal2-lestow-popup .swal2-success-fix,
    .swal2-lestow-popup .swal2-success-ring,
    .swal2-lestow-popup .swal2-success-line-tip,
    .swal2-lestow-popup .swal2-success-line-long {
      display: none !important;
    }
    .swal2-lestow-popup .swal2-icon.swal2-success .swal2-icon-content {
      display: flex !important;
      align-items: center;
      justify-content: center;
      font-size: 1.85rem !important;
      font-weight: 700 !important;
      color: #059669 !important;
      line-height: 1 !important;
    }
    .swal2-lestow-popup .swal2-icon.swal2-question {
      background: #f8fafc !important;
      color: #475569 !important;
    }
    .swal2-lestow-popup .swal2-icon.swal2-question .swal2-icon-content {
      font-size: 1.65rem !important;
      font-weight: 700 !important;
      color: #475569 !important;
    }
    .swal2-lestow-title {
      margin: 0 0 0.45rem !important;
      padding: 0 !important;
      font-size: 1.2rem !important;
      font-weight: 700 !important;
      letter-spacing: -0.02em !important;
      color: #0f172a !important;
      line-height: 1.3 !important;
    }
    .swal2-lestow-text {
      margin: 0 !important;
      padding: 0 0.25rem !important;
      font-size: 0.9rem !important;
      font-weight: 450 !important;
      color: #64748b !important;
      line-height: 1.55 !important;
    }
    .swal2-lestow-actions {
      display: flex !important;
      flex-wrap: wrap !important;
      justify-content: center !important;
      gap: 0.65rem !important;
      margin: 1.45rem 0 0 !important;
      width: 100% !important;
    }
    .swal2-lestow-confirm,
    .swal2-lestow-confirm-info,
    .swal2-lestow-cancel {
      margin: 0 !important;
      min-width: 7.5rem !important;
      border-radius: 12px !important;
      font-weight: 600 !important;
      font-size: 0.875rem !important;
      padding: 0.72rem 1.2rem !important;
      box-shadow: none !important;
      transition: background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease !important;
    }
    .swal2-lestow-confirm:active,
    .swal2-lestow-confirm-info:active,
    .swal2-lestow-cancel:active {
      transform: translateY(1px) !important;
    }
    .swal2-lestow-confirm {
      background: #dc2626 !important;
      color: #fff !important;
      border: 0 !important;
    }
    .swal2-lestow-confirm:hover {
      background: #b91c1c !important;
      box-shadow: 0 8px 20px rgba(220, 38, 38, 0.25) !important;
    }
    .swal2-lestow-confirm-info {
      background: #0f172a !important;
      color: #fff !important;
      border: 0 !important;
      min-width: 8.5rem !important;
    }
    .swal2-lestow-confirm-info:hover {
      background: #1e293b !important;
      box-shadow: 0 8px 20px rgba(15, 23, 42, 0.22) !important;
    }
    .swal2-lestow-cancel {
      background: #f8fafc !important;
      color: #0f172a !important;
      border: 1px solid #e2e8f0 !important;
    }
    .swal2-lestow-cancel:hover {
      background: #f1f5f9 !important;
    }
    /* Center edit-mode confirms over Create-AI preview (not full window) */
    [data-cai-preview-shell="1"] > .swal2-container {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
    }
  `;
  document.head.appendChild(style);
}

const baseClasses = {
  popup: "swal2-lestow-popup",
  title: "swal2-lestow-title",
  htmlContainer: "swal2-lestow-text",
  actions: "swal2-lestow-actions",
  confirmButton: "swal2-lestow-confirm",
  cancelButton: "swal2-lestow-cancel",
} as const;

function getCreateAiPreviewSwalTarget(): HTMLElement {
  if (typeof document === "undefined") return document.body;
  return (
    (document.querySelector(
      '[data-cai-preview-shell="1"]',
    ) as HTMLElement | null) || document.body
  );
}

const baseFireOptions = {
  buttonsStyling: false,
  reverseButtons: true,
  heightAuto: false,
  scrollbarPadding: false,
  showClass: {
    popup: "swal2-show",
    backdrop: "swal2-backdrop-show",
  },
} as const;

export async function confirmStartFresh(options?: {
  title?: string;
  text?: string;
}): Promise<boolean> {
  ensureLestowSwalStyles();
  const result = await Swal.fire({
    ...baseFireOptions,
    title: options?.title || "Start fresh?",
    text: options?.text || START_FRESH_MESSAGE,
    icon: "warning",
    showCancelButton: true,
    focusCancel: true,
    confirmButtonText: "Yes, start fresh",
    cancelButtonText: "Cancel",
    customClass: baseClasses,
  });
  return Boolean(result.isConfirmed);
}

export async function confirmDangerAction(options: {
  title: string;
  text: string;
  confirmButtonText?: string;
}): Promise<boolean> {
  ensureLestowSwalStyles();
  const result = await Swal.fire({
    ...baseFireOptions,
    target: getCreateAiPreviewSwalTarget(),
    title: options.title,
    text: options.text,
    icon: "warning",
    showCancelButton: true,
    focusCancel: true,
    confirmButtonText: options.confirmButtonText || "Delete",
    cancelButtonText: "Cancel",
    customClass: baseClasses,
  });
  return Boolean(result.isConfirmed);
}

export async function showAppAlert(options: {
  title?: string;
  text: string;
  icon?: "info" | "warning" | "error" | "success" | "question";
  confirmButtonText?: string;
}): Promise<void> {
  ensureLestowSwalStyles();
  await Swal.fire({
    ...baseFireOptions,
    title: options.title || "Notice",
    text: options.text,
    icon: options.icon || "info",
    iconHtml: options.icon === "success" ? "✓" : undefined,
    confirmButtonText: options.confirmButtonText || "Got it",
    customClass: {
      ...baseClasses,
      confirmButton: "swal2-lestow-confirm-info",
    },
  });
}
