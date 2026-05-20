import React from "react";
import { Modal } from "antd";

const DeleteConfirmModal = ({ visible, onCancel, onConfirm, title, content }) => {
  return (
    <Modal
      centered
      title={title || "Confirm Delete"}
      open={visible}
      onCancel={onCancel}
      onOk={onConfirm}
      okText="Delete"
      cancelText="Cancel"
      okButtonProps={{
        danger: true,
      }}
    >
      <p>{content || "Are you sure you want to delete this item? This action cannot be undone."}</p>
    </Modal>
  );
};

export default DeleteConfirmModal;
