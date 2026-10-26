# Responsabilidades e capacidades: estudo da planilha

Fonte: `RESPOSABILIDADES.xlsx`, fornecida por Patrick em 2026-10-25. O arquivo
estruturado correspondente e `UNIVERSO_RAMOS_RESPONSABILIDADES_CURADAS.json`.
O hash SHA-256 da planilha consta no JSON para que uma revisao futura saiba
exatamente qual versao foi tratada. A planilha original nao foi alterada.

**Estado em 2026-10-25:** 51 responsabilidades aplicaveis integradas ao Plano Mestre.
O JSON nao e compativel com o botao "Importar backup JSON", que espera
`MasterPlanDraft` v1. A origem auditavel continua neste arquivo; os registros
operacionais do Plano Mestre agora guardam titulos, setores e codigos de
capacidades para os vinculos ja validados. Fichas completas e niveis minimos
continuam na fonte curada e na interface, nao no documento v1.

## Integracao realizada

- Tres setores foram cadastrados no Universo Ramos: SERVICOS DE CAMPO,
  FINANCEIRO e TECNOLOGIA E SISTEMAS. O total passou de 11 para 14 setores.
- 51 responsabilidades foram salvas no documento versionado: 14 em GESTAO E
  PLANEJAMENTO por decisao de Patrick, 12 em LICENCIAMENTO E PROCESSOS, 11 em
  SETOR DE PROJETOS e 14 em SERVICOS DE CAMPO. Cada vinculo conserva o ID da
  fonte e os codigos das capacidades exigidas; 28 capacidades foram
  disponibilizadas no documento.
- Quatro categorias sem perfil e uma responsabilidade transversal permanecem
  fora da importacao automatica. Os outros dez setores nao receberam
  responsabilidades genericas: faltam entradas especificas na fonte.
- Ninguem foi designado titular ou substituto, e nenhuma certificacao foi
  concedida. Reexecutar a integracao pelos mesmos IDs nao duplica registros.
- No projeto configurado localmente, a tabela
  `master_plan_capability_library` ainda retorna `PGRST205`; por isso as fichas
  completas continuam lendo o catalogo curado do repositorio na previa.
  Aplicar o SQL da biblioteca e validar a tabela e uma etapa separada.
- O arquivo Excel foi relido apos a integracao. Seu hash atual e
  `4f4ebb45100a3092ccdc372dbe10b5ea3013894f6d4ee35c1463fde9e94d58b1`.
  A estrutura e os vinculos de responsabilidades sao identicos aos da versao
  anterior; mudaram os criterios de desempenho e as evidencias das 28 fichas.
  O JSON foi regenerado e a jornada passou a extrair de cada nivel o que
  entregar, como avaliar e quando aprovar.

## O que a planilha realmente contem

| Camada | Quantidade | Fonte principal | Leitura correta |
| --- | ---: | --- | --- |
| Agrupamentos de origem | 6 | `Responsabilidades por Setor!A4:A187` | Nomes da planilha, ainda nao IDs dos 11 setores atuais |
| Responsabilidades | 56 | Colunas A e B da mesma aba | Entregas continuas que um setor precisa garantir |
| Atividades/escopo | 184 | Colunas C e D da mesma aba | Detalhes de uma responsabilidade, nao tarefas novas |
| Capacidades | 28 | `Catalogo de Capacidades!A5:D32` | 10 transversais, 13 funcionais, 5 especializadas |
| Fichas completas | 28 | `Fichas de Capacidade!A5:P32` | Definicao, escopo, criterios, niveis, evidencias, pre-requisitos e limites |
| Exigencias de capacidade | 166 | `Perfil por Responsabilidade!A5:G170` | Vinculo responsabilidade-capacidade com nivel minimo |
| Perguntas de autoavaliacao | 112 | `Autoavaliacao!A5:E116` | Quatro perguntas para cada capacidade |
| Niveis | 4 | `Niveis!A5:D8` | 0 Nao capacitado; 1 Assistido; 2 Autonomo; 3 Multiplicador |

Os nomes acima representam as abas da planilha com acentos omitidos nesta
descricao. No JSON, `sourceRef` conserva o nome exato de cada aba e as celulas.
As colunas com formulas de contagem e de consulta foram **recalculadas a partir
dos dados de origem**; seus resultados coincidiram com os valores em cache do
Excel. A aba `Ficha de Capacidade` e uma tela de consulta por codigo, nao uma
29a capacidade.

### Organizacao por agrupamento da planilha

| Agrupamento original | Responsabilidades | Atividades | Perfis vinculados | Tratamento |
| --- | ---: | ---: | ---: | --- |
| Gestao Interna | 14 | 39 | Sim | Vinculadas a Gestao e Planejamento por decisao de Patrick |
| Processos e Orgaos | 12 | 59 | Sim | Vinculadas a Licenciamento e Processos |
| Projetos | 11 | 44 | Sim | Vinculadas a Setor de Projetos |
| Servicos, Visitas e Levantamentos | 14 | 33 | Sim | Vinculadas ao novo setor Servicos de Campo |
| Fora do Nucleo Tecnico | 4 | 4 | **Nao** | Quatro categorias amplas a desdobrar antes de cadastrar |
| Transversal (todos os setores) | 1 | 5 | Sim | Alcance transversal, sem duplicar onze responsabilidades |

Os quatro grupos sem capacidades vinculadas sao `Administrativo / Marketing`,
`Financeiro`, `Pessoas / RH` e `Tecnologia e Sistemas`. Eles aparecem na fonte
como agrupamentos de trabalho, mas nao possuem um perfil de capacidade. O JSON
os preserva e marca seus IDs em `review.unlinkedResponsibilityIds`.

## Modelo conceitual extraido

```
Setor de origem -> Responsabilidade -> atividades que a compoem
                                  -> capacidades exigidas + nivel minimo
Capacidade -> ficha de dominio + quatro perguntas de autoavaliacao
Pessoa -> resposta e comentario -> nivel indicado -> revisao/evidencia -> certificacao
```

O ultimo elo **nao** esta preenchido nesta planilha. Nenhum colaborador foi
atribuido a responsabilidade, nenhuma resposta individual foi registrada e
ninguem foi certificado por este tratamento. O nivel minimo de um perfil e
exigencia da responsabilidade, nao prova de dominio de uma pessoa.

Exemplo real: `Processos e Orgaos / Condicionantes` contem quatro atividades
(`Responsabilidades por Setor!C18`, `C19`, `C47`, `C48`) e exige F04 e T04 no
nivel Autonomo, mais T07 e F02 no nivel Assistido
(`Perfil por Responsabilidade!A68:F71`). A futura pagina pode mostrar esse
conjunto como uma ficha unica, sem transformar as quatro atividades em quatro
solicitacoes.

A autoavaliacao proposta na planilha tem quatro dimensoes: compreensao dos
requisitos, execucao, julgamento e decisao, qualidade e consistencia. As
respostas sao `Preciso de ajuda`, `Com apoio`, `Sozinho`, `Consigo ensinar`.
A menor resposta indica o nivel sugerido e o comentario e obrigatorio
(`Ficha de Capacidade!B43`, `A49:A50`). Isso nao substitui a validacao por
evidencias nem concede habilitacao legal ou tecnica.

## Encaixe com o Universo Ramos atual

Na plataforma publicada em 2026-10-25 havia 11 setores: ADMINISTRACAO,
BRINDES, GESTAO E PLANEJAMENTO, IA E AUTOMACAO, LICENCIAMENTO E PROCESSOS,
MANUTENCAO, MARKETING, PESSOAS E CULTURA, SETOR DE PROJETOS, SUPRIMENTOS E
COMPRAS e TREINAMENTOS. Esta lista vem da plataforma, **nao** da planilha.

| Nome da planilha | Destino no Plano Mestre | Situacao |
| --- | --- | --- |
| Projetos | SETOR DE PROJETOS | 11 vinculadas |
| Processos e Orgaos | LICENCIAMENTO E PROCESSOS | 12 vinculadas |
| Gestao Interna | GESTAO E PLANEJAMENTO | 14 vinculadas por decisao de Patrick |
| Servicos, Visitas e Levantamentos | SERVICOS DE CAMPO | 14 vinculadas; setor criado nesta integracao |
| Fora do Nucleo Tecnico | Varios destinos possiveis | Quatro categorias amplas a desdobrar; Financeiro e Tecnologia e Sistemas ja existem |
| Transversal (todos os setores) | Regra transversal | Definir se e responsabilidade comum ou protocolo de interface |

As 51 responsabilidades aplicaveis ja foram vinculadas no documento do Plano Mestre;
Gestao Interna foi direcionada a GESTAO E PLANEJAMENTO por decisao de Patrick.
Nenhum `sectorId` foi inserido no JSON-fonte. A entrada Transversal permanece
pendente. O `originLabel` das fichas e uma categoria da planilha,
nao um nucleo oficial cadastrado na plataforma.

## Arquivo estruturado

`UNIVERSO_RAMOS_RESPONSABILIDADES_CURADAS.json` usa `schemaVersion: 1` proprio
para **preparacao**, separado do `MasterPlanDraft.version: 1` da aplicacao.

- `capabilities[]`: codigo T/F/E, natureza, titulo, resumo, ficha completa,
  quatro perguntas e referencias de origem. Textos de pre-requisitos e
  capacidades relacionadas permanecem integrais; ainda nao viraram links
  automatizados, pois isso exige revisao das condicoes por nivel.
- `responsibilities[]`: ID estavel derivado do par setor/titulo de origem,
  atividades preservadas com seu tipo de origem e perfil de capacidades com
  codigo e nivel minimo. O ID identifica a proposta da planilha, nao um
  registro existente no Supabase.
- `levels[]` e `selfAssessmentPolicy`: vocabulario e regra sugerida pela fonte.
- `review` e `counts`: pendencias declaradas e reconciliacao quantitativa.
- `source.sha256` e `sourceRef`: trilha para auditar e corrigir qualquer item.

Para reproduzir o JSON sem alterar a planilha:

```text
node scripts/prepare-master-plan-catalog.mjs <RESPOSABILIDADES.xlsx> <saida.json>
```

O script usa a dependencia `xlsx` ja existente no repositorio e valida codigos,
niveis, duplicatas, existencia das 28 fichas e das quatro perguntas por
capacidade. Uma mudanca no arquivo de origem produz outro hash.

## Desenho da futura pagina

1. **Fila de revisao:** agrupamentos e responsabilidades da planilha com estados
   `nao mapeado`, `em revisao`, `aprovado` e `cadastrado`. Mostrar lado a lado
   o setor original e o setor real escolhido, com o delta antes de salvar.
2. **Responsabilidades por setor:** lista hierarquica, nao 184 cards. Cada uma
   abre ficha com atividades, capacidades exigidas e nivel minimo. Titular e
   substituto comecam vazios; so podem ser escolhidos apos revisao.
3. **Banco de capacidades:** filtros por Transversal, Funcional e Especializada.
   A ficha apresenta escopo, criterios, niveis, evidencias, pre-requisitos,
   limites e responsabilidades que a exigem.
4. **Minha capacitacao:** perguntas por capacidade, comentario obrigatorio e
   nivel *indicado*. Certificacao precisa de avaliador, evidencias e registro
   separado; autoavaliacao nao libera uma responsabilidade sozinha.
5. **Cobertura:** matriz de responsabilidades por setor com titular, substituto,
   capacidades requeridas e lacunas. Nao usar a porcentagem de solicitacoes
   concluidas como substituta da cobertura tecnica; sao indicadores diferentes.

## Pendencias para completar a integracao

1. Definir o tratamento do item transversal. Os setores Servicos de Campo, Financeiro
   e Tecnologia e Sistemas ja foram criados; as categorias amplas ainda
   precisam ser desdobradas em responsabilidades com perfil de capacidades.
2. Revisar as quatro categorias amplas sem perfil e as responsabilidades que
   atravessam mais de um setor.
3. Validar fichas, niveis minimos e limites profissionais com os responsaveis
   tecnicos. Capacidade interna nao equivale a atribuicao legal ou ART.
4. Criar um formato persistente mais rico (documento v2 com migracao
   controlada ou tabelas normalizadas). O documento atual guarda titulo,
   setor e IDs de capacidade, mas nao atividades, niveis nem fichas completas.
5. Verificar a aplicacao do SQL da biblioteca no projeto configurado antes
   de declarar que todo o conteudo da planilha esta publicado no banco.
   Depois validar uma amostra no ambiente de teste antes da producao.

Nenhuma tarefa, desafio, solicitacao, colaborador ou cadastro atual foi
modificado para produzir estes arquivos.
