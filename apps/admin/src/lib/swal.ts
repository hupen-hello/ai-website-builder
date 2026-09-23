import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const brand = "#e53935";

export function swalError(message: string, title = "Error") {
  return Swal.fire({
    icon: "error",
    title,
    text: message,
    confirmButtonColor: brand,
  });
}

export function swalSuccess(message: string, title = "Success") {
  return Swal.fire({
    icon: "success",
    title,
    text: message,
    confirmButtonColor: brand,
    timer: 1800,
    showConfirmButton: true,
  });
}

export function swalConfirm(message: string, title = "Are you sure?") {
  return Swal.fire({
    icon: "warning",
    title,
    text: message,
    showCancelButton: true,
    confirmButtonColor: brand,
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes",
    cancelButtonText: "Cancel",
  });
}
