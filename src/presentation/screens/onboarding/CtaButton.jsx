import { ArrowLeft, ChevronRight } from 'lucide-preact';
import { he } from '../../../locale/he.js';

export function CtaButton({ label, loading = false, disabled = false, onClick, type = 'button' }) {
  return (
    <button
      type={type}
      class="cta"
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading ? 'true' : undefined}
    >
      {label}
      <span class="cta-arrow">
        {loading ? (
          <span class="spinner" role="status" aria-label={he.common.loading} />
        ) : (
          <ArrowLeft size={20} strokeWidth={2} aria-hidden="true" />
        )}
      </span>
    </button>
  );
}

export function BackButton({ onClick }) {
  return (
    <button type="button" class="round-button" aria-label={he.common.back} onClick={onClick}>
      <ChevronRight size={21} strokeWidth={2} aria-hidden="true" />
    </button>
  );
}

export function Banner({ kind = 'error', children }) {
  return (
    <div class={`banner banner-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
