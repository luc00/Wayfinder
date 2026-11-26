import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  label: string;
  copiedLabel?: string;
  variant?: 'primary' | 'secondary';
  className?: string;
  disabled?: boolean;
}

export function CopyButton({
  text,
  label,
  copiedLabel = 'Copiato!',
  variant = 'primary',
  className = '',
  disabled = false,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!text || disabled) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const el = document.createElement('textarea');
        el.value = text;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  const baseStyles =
    'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer hover:-translate-y-0.5';

  const variantStyles =
    variant === 'primary'
      ? copied
        ? 'bg-[#10B981] text-white border-2 border-[#059669] shadow-[0_6px_18px_rgba(16,185,129,0.28)]'
        : 'bg-[#111111] hover:bg-zinc-800 text-white border-2 border-[#111111] shadow-[0_6px_18px_rgba(0,0,0,0.2)]'
      : copied
        ? 'bg-[#DCFCE7] text-[#15803D] border-2 border-[#10B981] shadow-[0_4px_14px_rgba(0,0,0,0.1)]'
        : 'bg-white hover:bg-zinc-50 text-[#111111] border-2 border-[#111111] shadow-[0_4px_14px_rgba(0,0,0,0.12)]';

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={disabled || !text}
      className={`${baseStyles} ${variantStyles} ${className}`}
    >
      {copied ? (
        <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
      ) : (
        <Copy className="w-4 h-4 shrink-0" aria-hidden="true" />
      )}
      <span>{copied ? copiedLabel : label}</span>
    </button>
  );
}
