import { STATUS_CLASS, type PrototypeReceiptStatus } from "@/lib/portal";

export default function StatusPill({
  status,
}: {
  status: PrototypeReceiptStatus;
}) {
  return (
    <span className={`status ${STATUS_CLASS[status]}`}>
      <i className="status-dot" />
      {status}
    </span>
  );
}
