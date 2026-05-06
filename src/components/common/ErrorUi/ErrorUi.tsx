import { FaExclamationTriangle } from "react-icons/fa";
export default function ErrorUi({ error }: { error: any }) {
  return (
    <div style={{ textAlign: "center", color: "#a7b3d1" }}>
      <FaExclamationTriangle
        size={40}
        style={{ marginBottom: "1.5rem", color: "#4f7df3" }}
      />
      <p style={{ fontSize: "1.6rem" }}>{error?.message}</p>
    </div>
  );
}
