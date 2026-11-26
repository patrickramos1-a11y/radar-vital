import { useEffect, useState } from 'react';
import { aplicarTema, EVENTO_TEMA, guardarModo, lerModo, type TemaModo } from '@/lib/tema';
import { DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu';

const SPRITE = '/ramos/icones-ramos.svg';

const OPCOES: { modo: TemaModo; nome: string; dica: string }[] = [
  { modo: 'claro', nome: 'Dia', dica: 'Tela branca (padrão)' },
  { modo: 'escuro', nome: 'Noite', dica: 'Tela escura' },
  { modo: 'auto', nome: 'Auto', dica: 'Dia das 6h às 18h, noite fora disso' },
];

function IconeModo({ modo }: { modo: TemaModo }) {
  if (modo === 'auto') {
    return <svg viewBox="0 0 24 24" className="icone-ramos h-4 w-4" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" stroke="none" /></svg>;
  }
  return <svg className="icone-ramos h-4 w-4" aria-hidden="true"><use href={`${SPRITE}#${modo === 'claro' ? 'r-sol' : 'r-lua'}`} /></svg>;
}

/** Modo escolhido pela pessoa, sempre em dia com o que outra parte da tela mudou. */
function useModoTema(): [TemaModo, (modo: TemaModo) => void] {
  const [modo, setModo] = useState<TemaModo>(() => lerModo());
  useEffect(() => {
    const atualizar = () => setModo(lerModo());
    window.addEventListener(EVENTO_TEMA, atualizar);
    return () => window.removeEventListener(EVENTO_TEMA, atualizar);
  }, []);
  return [modo, guardarModo];
}

/**
 * Aplica o tema na tela, sem mostrar nada. A plataforma é branca por padrão;
 * quem quiser escolhe Noite ou Auto no menu do perfil. O Plano Mestre fica
 * sempre no claro (visual anterior).
 */
export function useTemaRamos(travadoNoClaro = false) {
  const [modo] = useModoTema();
  useEffect(() => {
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
}

/** Escolha do tema dentro do menu do perfil (configuração pessoal). */
export function TemaMenu() {
  const [modo, escolher] = useModoTema();
  return <>
    <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Tema da tela</DropdownMenuLabel>
    <DropdownMenuRadioGroup value={modo} onValueChange={valor => escolher(valor as TemaModo)}>
      {OPCOES.map(opcao => <DropdownMenuRadioItem key={opcao.modo} value={opcao.modo} title={opcao.dica} className="flex cursor-pointer items-center gap-2">
        <IconeModo modo={opcao.modo} />
        <span>{opcao.nome}</span>
        {opcao.modo === 'claro' && <span className="ml-auto text-[10px] text-muted-foreground">padrão</span>}
      </DropdownMenuRadioItem>)}
    </DropdownMenuRadioGroup>
  </>;
}
