import { useEffect, useState } from 'react';
import { aplicarTema, guardarModo, lerModo, type TemaModo } from '@/lib/tema';
import { cn } from '@/lib/utils';

const SPRITE = '/ramos/icones-ramos.svg';

const OPCOES: { modo: TemaModo; nome: string; dica: string }[] = [
  { modo: 'auto', nome: 'Auto', dica: 'Automático: dia das 6h às 18h, noite fora disso' },
  { modo: 'claro', nome: 'Dia', dica: 'Sempre dia' },
  { modo: 'escuro', nome: 'Noite', dica: 'Sempre noite' },
];

function IconeModo({ modo }: { modo: TemaModo }) {
  if (modo === 'auto') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" stroke="none" /></svg>;
  }
  return <svg aria-hidden="true"><use href={`${SPRITE}#${modo === 'claro' ? 'r-sol' : 'r-lua'}`} /></svg>;
}

/** Seletor Auto/Dia/Noite da Ramos. No modo Auto, troca sozinho às 6h e às 18h. */
export function TemaSeletor({ compacto = false, travadoNoClaro = false, className }: { compacto?: boolean; travadoNoClaro?: boolean; className?: string }) {
  const [modo, setModo] = useState<TemaModo>(() => lerModo());

  useEffect(() => {
    // O Plano Mestre fica no visual anterior, sempre claro.
    if (travadoNoClaro) {
      aplicarTema('claro');
      document.documentElement.dataset.temaModo = modo;
      return;
    }
    aplicarTema(modo);
    if (modo !== 'auto') return;
    const relogio = window.setInterval(() => aplicarTema('auto'), 60_000);
    return () => window.clearInterval(relogio);
  }, [modo, travadoNoClaro]);

  const escolher = (proximo: TemaModo) => {
    guardarModo(proximo);
    setModo(proximo);
  };

  return <div role="group" aria-label="Tema da tela" className={cn('ramos-seletor-tema', compacto && 'ramos-seletor-tema--compacto', className)}>
    {OPCOES.map(opcao => <button
      key={opcao.modo}
      type="button"
      aria-pressed={modo === opcao.modo}
      disabled={travadoNoClaro}
      title={travadoNoClaro ? 'O Plano Mestre fica sempre no claro' : opcao.dica}
      aria-label={compacto ? `Tema: ${opcao.nome}` : undefined}
      onClick={() => escolher(opcao.modo)}
    >
      <IconeModo modo={opcao.modo} /><span>{opcao.nome}</span>
    </button>)}
  </div>;
}
