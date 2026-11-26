import { forwardRef, type CSSProperties, type ForwardRefExoticComponent, type RefAttributes, type SVGProps } from 'react';
import { cn } from '@/lib/utils';

/**
 * Ícones Ramos (biblioteca aplicar-design, public/ramos/icones-ramos.svg).
 * Um padrão só: traço fino na cor do texto e um detalhe na cor de acento
 * (verde Ramos por padrão; azul no tom água do Radar Vital).
 */
const SPRITE = '/ramos/icones-ramos.svg';

export interface IconeRamosProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  /** Tamanho em px (como no Lucide). Sem ele, vale a classe (h-4 w-4...) ou 1em. */
  size?: number | string;
  /** Aceito por compatibilidade com o Lucide; a espessura segue o tamanho. */
  strokeWidth?: number | string;
  absoluteStrokeWidth?: boolean;
}

export type LucideProps = IconeRamosProps;
export type LucideIcon = ForwardRefExoticComponent<IconeRamosProps & RefAttributes<SVGSVGElement>>;

/** Cria o componente de um ícone Ramos com o nome antigo (Lucide) para a troca ser transparente. */
const criados = new Map<string, LucideIcon>();

export function icone(nome: string, apelido: string): LucideIcon {
  const chave = `${nome}|${apelido}`;
  const pronto = criados.get(chave);
  if (pronto) return pronto;
  const Componente = forwardRef<SVGSVGElement, IconeRamosProps>(({ size, strokeWidth: _s, absoluteStrokeWidth: _a, className, style, ...resto }, ref) => {
    const tamanho = size !== undefined ? { width: size, height: size } : null;
    return <svg
      ref={ref}
      aria-hidden={resto['aria-label'] ? undefined : true}
      focusable="false"
      {...resto}
      {...tamanho}
      className={cn('icone-ramos', className)}
      style={style as CSSProperties}
      data-icone={nome}
    >
      <use href={`${SPRITE}#r-${nome}`} />
    </svg>;
  });
  Componente.displayName = apelido;
  criados.set(chave, Componente);
  return Componente;
}

/** Ícone Ramos pelo nome da biblioteca (sem o prefixo r-). */
export function IconeRamos({ nome, ...props }: IconeRamosProps & { nome: string }) {
  const Componente = icone(nome, nome);
  return <Componente {...props} />;
}

/**
 * Selo de vidro com o arco da logo, para ícones que identificam algo
 * (menu lateral, cabeçalho de seção, indicador). Só a partir de 32px.
 */
export function SeloRamos({ nome, atual = false, tamanho = 36, className, rotulo }: { nome: string; atual?: boolean; tamanho?: number; className?: string; rotulo?: string }) {
  return <span
    className={cn('selo-ramos', atual && 'selo-ramos--atual', className)}
    style={{ '--selo': `${tamanho}px` } as CSSProperties}
    role={rotulo ? 'img' : undefined}
    aria-label={rotulo}
    aria-hidden={rotulo ? undefined : true}
  >
    <svg aria-hidden="true"><use href={`${SPRITE}#r-${nome}`} /></svg>
  </span>;
}
