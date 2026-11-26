/**
 * Dia e noite da Ramos (mesma regra do `tema.js` da biblioteca aplicar-design).
 * O Radar Vital é branco por padrão (pedido do Patrick, 26/11/2026); a pessoa
 * escolhe Noite ou Auto (dia das 6h às 18h) no menu do perfil.
 * A escolha fica no aparelho (`localStorage['ramos-tema']`); `?tema=claro|escuro`
 * no endereço força o tema só nesta aba. O <head> do index.html aplica o tema
 * antes do primeiro desenho, para a tela não piscar.
 */
export type TemaModo = 'auto' | 'claro' | 'escuro';
export type Tema = 'claro' | 'escuro';

export const CHAVE_TEMA = 'ramos-tema';
/** Avisa as partes da tela que a pessoa trocou o tema. */
export const EVENTO_TEMA = 'ramos:tema-modo';
const MODO_PADRAO: TemaModo = 'claro';
const INICIO_DIA = 6;
const INICIO_NOITE = 18;

export function temaPelaHora(agora = new Date()): Tema {
  const hora = agora.getHours();
  return hora >= INICIO_DIA && hora < INICIO_NOITE ? 'claro' : 'escuro';
}

function modoValido(valor: string | null | undefined): TemaModo | null {
  return valor === 'auto' || valor === 'claro' || valor === 'escuro' ? valor : null;
}

export function lerModo(): TemaModo {
  if (typeof window === 'undefined') return MODO_PADRAO;
  const forcado = modoValido(new URLSearchParams(window.location.search).get('tema'));
  if (forcado) return forcado;
  try {
    return modoValido(window.localStorage.getItem(CHAVE_TEMA)) ?? MODO_PADRAO;
  } catch {
    return MODO_PADRAO;
  }
}

export function aplicarTema(modo: TemaModo, agora = new Date()): Tema {
  const tema = modo === 'auto' ? temaPelaHora(agora) : modo;
  const raiz = document.documentElement;
  raiz.dataset.tema = tema;
  raiz.dataset.temaModo = modo;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tema === 'escuro' ? '#0a1a13' : '#ffffff');
  return tema;
}

export function guardarModo(modo: TemaModo) {
  try {
    window.localStorage.setItem(CHAVE_TEMA, modo);
  } catch {
    // Aparelho sem armazenamento: o tema vale só até fechar a aba.
  }
  // Tira o ?tema= do endereço para a escolha valer na hora.
  const endereco = new URL(window.location.href);
  if (endereco.searchParams.has('tema')) {
    endereco.searchParams.delete('tema');
    window.history.replaceState(window.history.state, '', endereco.toString());
  }
  window.dispatchEvent(new Event(EVENTO_TEMA));
}
