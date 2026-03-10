

## Cadastro de Usuários na página de Configurações

### O que será feito

Adicionar uma seção "Cadastro de Usuários" na página Config (similar ao padrão do "Cadastro de Municípios"), com:

1. **Lista de usuários** — tabela mostrando todos os colaboradores cadastrados na tabela `collaborators`, com nome, iniciais, cor, tipo de perfil (admin/colaborador) e status ativo/inativo
2. **Tipo de perfil** — novo campo `role` na tabela `collaborators` (text, default 'colaborador'), com opções: "admin" e "colaborador"
3. **Seletor de cor** — paleta visual para escolher a cor do perfil
4. **Cadastro simples** — apenas nome (sem e-mail, sem senha)
5. **Editar e excluir** — botões inline para cada colaborador

### Mudanças técnicas

**1. Migração de banco de dados**
- Adicionar coluna `role text NOT NULL DEFAULT 'colaborador'` na tabela `collaborators`

**2. Novo componente `CollaboratorManager`** (dentro de `Config.tsx`)
- Seção colapsável (mesmo padrão do `MunicipalityManager`)
- Formulário: campo nome + seletor de cor (círculos clicáveis) + select de perfil (admin/colaborador)
- Tabela: avatar colorido, nome, perfil (badge), cor, ativo/inativo, ações (editar/excluir)
- Edição inline ou modal simples para alterar nome, cor, perfil
- Confirmação antes de excluir

**3. Hook `useCollaborators`** 
- Já existe e tem `addCollaborator`, `updateCollaborator`. Será estendido para incluir `deleteCollaborator` e suporte ao campo `role`.

**4. Atualização do tipo `Collaborator`**
- Adicionar campo `role: 'admin' | 'colaborador'` ao tipo em `src/types/collaborator.ts`

### Fluxo do usuário
- Abre Config → vê seção "Cadastro de Usuários" (colapsável)
- Expande → vê lista de todos os colaboradores com cor, nome, perfil
- Pode adicionar novo digitando nome, escolhendo cor e tipo
- Pode editar (lápis) ou excluir (lixeira) qualquer colaborador existente

