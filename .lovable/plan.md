## Objetivo
Somente o administrador (Patrick) poderá avaliar entregáveis (joinha, estrelas, super estrela). Isso impede auto-atribuição de pontos pelos colaboradores.

## Alterações

### 1. `src/components/central-entregas/DeliverableRating.tsx`
- Detectar se o usuário atual é admin comparando `currentUser` com `'Patrick'` (case-insensitive), padrão já usado no projeto (`mem://logic/activity-log-attribution`).
- Se não for admin: desabilitar os botões de joinha, estrelas e super estrela (mesmo tratamento visual do `disabled` atual — opacity + pointer-events-none), e exibir uma linha explicativa com ícone `Lock`: "Apenas o administrador pode avaliar."
- Manter a exibição dos totais (joinhas, estrelas, super, pontos) visível para todos.
- A regra do `disabled` existente (entregável não concluído) continua valendo em cima disso.

### 2. Limpeza de avaliações antigas (banco)
Executar uma exclusão única em `deliverable_ratings` removendo qualquer registro cujo `rater_name` não seja "Patrick" (comparação case-insensitive, sem acentos). Isso zera joinhas/estrelas atribuídas por não-admin, mantendo apenas as do admin.

```sql
DELETE FROM public.deliverable_ratings
WHERE lower(rater_name) <> 'patrick';
```

### 3. Defesa no hook `src/hooks/useDeliverableRatings.ts`
- Em `rate()` e `removeRating()`: se `getCurrentUserName()` não for Patrick, abortar com `toast.error('Apenas o administrador pode avaliar')` antes de chamar o Supabase. Camada de proteção extra, além da UI desabilitada.

## Preservado
- Fórmula de pontuação (estrela = valor 1–5, super = 10, joinha = 0) conforme `mem://logic/governance-responsible-tracking-v2` e código atual.
- Regra que libera avaliação apenas após conclusão do entregável.
- Ranking na aba Entregáveis e KPIs de Performance continuam funcionando; recalcularão automaticamente após a limpeza.
- Nenhuma mudança em RLS/policies do banco (o gate é por identidade local, coerente com `mem://auth/local-user-selection-model`).

## Verificação
- Typecheck do build.
- Logar como colaborador não-admin: botões de avaliação aparecem desabilitados com mensagem "Apenas o administrador pode avaliar"; totais continuam visíveis.
- Logar como Patrick: avaliação funciona normalmente em entregáveis concluídos.
- Após migração de limpeza: cards mostram apenas avaliações do Patrick; ranking recalculado.
