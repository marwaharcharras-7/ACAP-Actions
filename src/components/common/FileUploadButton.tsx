import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadButtonProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  isLoading?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  onFileSelect,
  accept = '*',
  isLoading = false,
  variant = 'outline',
  size = 'default',
  children,
  className,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!isLoading && !disabled) {
      inputRef.current?.click();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      // Reset input to allow re-selecting the same file
      e.target.value = '';
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={isLoading || disabled}
        className={cn('gap-2', className)}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {children || 'Téléverser'}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
    </>
  );
};

export default FileUploadButton;
