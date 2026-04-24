import toast from "react-hot-toast";
import { FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import React from "react";

const ToastLayout = ({
  icon,
  message,
  actionElement,
}: {
  icon: React.ReactNode;
  message: string;
  actionElement?: React.ReactNode;
}) => (
  <div className={actionElement ? "toast-content" : "toast-message"}>
    <div
      className="toast-message"
      style={!actionElement ? { width: "100%" } : {}}
    >
      {icon}
      <span>{message}</span>
    </div>
    {actionElement && (
      <>
        <div className="toast-divider"></div>
        {actionElement}
      </>
    )}
  </div>
);

export const uiToast = {
  success: (message: string, id?: string) =>
    toast(
      <ToastLayout
        icon={
          <FiCheckCircle
            size="1.6rem"
            color="#1db954"
          />
        }
        message={message}
      />,
      {
        className: "minimal-toast",
        ...(id ? { id } : {}),
      },
    ),

  error: (message: string, id?: string) =>
    toast(
      <ToastLayout
        icon={
          <FiAlertCircle
            size="1.6rem"
            color="#ff5555"
          />
        }
        message={message}
      />,
      {
        className: "minimal-toast",
        ...(id ? { id } : {}),
      },
    ),

  // 액션 버튼 (클릭 시 닫힘 로직 포함)
  action: (message: string, icon: React.ReactNode, actionElement: React.ReactNode, id?: string) =>
    toast(
      (t) => (
        <ToastLayout
          icon={icon}
          message={message}
          actionElement={<div onClick={() => t.id && toast.dismiss(t.id)}>{actionElement}</div>}
        />
      ),
      {
        className: "minimal-toast",
        duration: 5000,
        ...(id ? { id } : {}),
      },
    ),

  custom: (message: string, icon: React.ReactNode, id?: string) =>
    toast(
      <ToastLayout
        icon={icon}
        message={message}
      />,
      {
        className: "minimal-toast",
        ...(id ? { id } : {}),
      },
    ),
};
