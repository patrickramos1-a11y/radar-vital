import { cn } from '@/lib/utils';

/** Estilos comuns dos formulários de processo (Novo processo e Novo acompanhamento). */
export const selectClass = 'h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm';
export const fieldLabel = 'text-xs font-semibold uppercase tracking-wide text-muted-foreground';

/** Janela no computador; no celular, folha que sobe do rodapé ocupando a largura toda. */
export const sheetDialogClass = cn(
  'flex max-h-[92vh] max-w-lg flex-col gap-0 overflow-hidden p-0',
  'max-sm:bottom-0 max-sm:top-auto max-sm:max-h-[94dvh] max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-2xl max-sm:border-x-0 max-sm:border-b-0 max-sm:data-[state=closed]:slide-out-to-bottom max-sm:data-[state=open]:slide-in-from-bottom max-sm:data-[state=closed]:zoom-out-100 max-sm:data-[state=open]:zoom-in-100',
);

export const sheetFooterClass = 'grid shrink-0 grid-cols-2 gap-2 border-t bg-background px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex sm:justify-end sm:px-6';
