import { useState } from 'react';
import { copyToClipboard } from '../../services/scriptGenerator';

export function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="text-xs text-brand-500 hover:text-brand-600 font-medium transition-colors"
    >
      {copied ? '✓ Copiado' : 'Copiar'}
    </button>
  );
}
