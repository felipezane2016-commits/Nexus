import { STATUS_CLASS, type PrototypeReceiptStatus } from "@/lib/portal";

export default function StatusPill({
  status,
}: {
  status: PrototypeReceiptStatus;
}) {
  return (
    <span className={`status-pill ${STATUS_CLASS[status]}`}>
      <span className="status-dot" aria-hidden="true" />
      {status}
    </span>
  );
}
