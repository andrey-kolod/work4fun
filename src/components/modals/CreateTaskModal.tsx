// src/components/modals/CreateTaskModal.tsx

'use client';

import { useState } from 'react';
import { TaskFormWrapper } from '@/components/forms/TaskFormWrapper';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface CreateTaskModalProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function CreateTaskModal({ trigger, onSuccess }: CreateTaskModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = () => {
    setIsOpen(false);
    if (onSuccess) onSuccess();
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <>
      {trigger || <Button onClick={() => setIsOpen(true)}>+ Новая задача</Button>}

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Создание новой задачи"
        size="lg"
      >
        <div className="max-h-[80vh] overflow-y-auto p-1">
          <TaskFormWrapper onSuccess={handleSuccess} onCancel={handleCancel} mode="create" />
        </div>
      </Modal>
    </>
  );
}
