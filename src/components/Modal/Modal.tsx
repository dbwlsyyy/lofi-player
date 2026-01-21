'use client';

import React from 'react';
import styles from './Modal.module.css';
import { FiAlertCircle } from 'react-icons/fi';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info';
}

export default function Modal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = '확인',
    cancelText = '취소',
    type = 'danger',
}: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                className={styles.content}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.header}>
                    <FiAlertCircle
                        size="2.4rem"
                        color={type === 'danger' ? '#ff5555' : '#3b82f6'}
                    />
                    <h3>{title}</h3>
                </div>
                <p className={styles.message}>{message}</p>
                <div className={styles.actions}>
                    <button className={styles.cancelBtn} onClick={onClose}>
                        {cancelText}
                    </button>
                    <button
                        className={`${styles.confirmBtn} ${type === 'danger' ? styles.danger : styles.info}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
