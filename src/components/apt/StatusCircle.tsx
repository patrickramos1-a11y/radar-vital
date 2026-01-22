import React from 'react';
import { cn } from '@/lib/utils';

interface StatusCircleProps {
  status: 'pendente' | 'executado' | 'aprovado' | 'nao_realizado' | 'nao_aprovado';
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusCircle({ status, onClick, disabled = false, size = 'md' }: StatusCircleProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'executado':
      case 'aprovado':
        return 'bg-blue-500 border-blue-600';
      case 'nao_realizado':
      case 'nao_aprovado':
        return 'bg-red-500 border-red-600';
      case 'pendente':
      default:
        return 'bg-white border-gray-400';
    }
  };

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-full border-2 transition-all duration-200 flex items-center justify-center',
        sizeClasses[size],
        getStatusColor(),
        !disabled && 'cursor-pointer hover:scale-110 hover:shadow-md',
        disabled && 'cursor-not-allowed opacity-60'
      )}
      aria-label={`Status: ${status}`}
    />
  );
}
