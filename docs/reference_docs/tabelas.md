# Tabelas de Dados (Data Types)

## sop

# sop (Data Type)

## Summary
Define a estrutura para Armazenamento de Procedimentos Operacionais Padrão (SOPs), incluindo nome, ordem, usuários autorizados e tags associadas.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| name | text | Não |
| order | number | Não |
| authorized_users | list of User | Não |
| tags | List of custom SOP Paste | Não |
| authorized_users_types | List of os_user_type | Não |

---

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |
| order | unknown | Não | Não |
| authorized_users | unknown | Não | Não |
| tags | unknown | Não | Não |
| authorized_users_types | unknown | Não | Não |

## task

# task (Data Type)

## Summary
Define a estrutura de dados para tarefas, incluindo detalhes como nome, datas, descrição, prioridade, tempo estimado e status. Permite associar a tarefa a um projeto e a outros usuários.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| name | text | Não |
| order | number | Não |
| end_date_estimated | date | Não |
| start_date_estimated | date | Não |
| description | text | Não |
| real_time | number | Não |
| parent_task | task | Não |
| end_date_real | date | Não |
| assignees | list of user | Não |
| start_date_real | date | Não |
| estimated_time | number | Não |
| priority_level | number | Não |
| project | project | Não |
| type | os_task_type | Não |
| authorized_users | list of user | Não |
| level | os_task_level | Não |
| status | os_task_status | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |
| order | unknown | Não | Não |
| end_date_estimated | unknown | Não | Não |
| start_date_estimated | unknown | Não | Não |
| description | unknown | Não | Não |
| real_time | unknown | Não | Não |
| parent_task | unknown | Não | Não |
| end_date_real | unknown | Não | Não |
| assignees | unknown | Não | Não |
| start_date_real | unknown | Não | Não |
| estimated_time | unknown | Não | Não |
| priority_level | unknown | Não | Não |
| project | unknown | Não | Não |
| type | unknown | Não | Não |
| authorized_users | unknown | Não | Não |
| level | unknown | Não | Não |
| status | unknown | Não | Não |

## User

# User (Data Type)

## Summary
Define a estrutura principal de dados para os usuários do sistema, armazenando informações pessoais, de contato e associações.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| picture | image | Não |
| last_name | text | Não |
| signature | file | Não |
| first_name | text | Não |
| type | option.os_user_type | Não |
| country | option.os_country | Não |

---

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| picture | unknown | Não | Não |
| last_name | unknown | Não | Não |
| signature | unknown | Não | Não |
| first_name | unknown | Não | Não |
| Subscription Error - deleted | unknown | Não | Não |
| type | unknown | Não | Não |
| country | unknown | Não | Não |
| Last Subscription ID - deleted | unknown | Não | Não |
| Role - deleted | unknown | Não | Não |
| Group Sessions Subscribed - deleted | unknown | Não | Não |

## internal_key_result

# internal_key_result

## Summary
Este Data Type representa um "Key Result" interno, detalhando seu nome, datas, status, descrição e o objetivo interno ao qual está associado.

## Campos

| Campo                  | Tipo    | Obrigatório |
|------------------------|---------|-------------|
| name                   | text    | Não         |
| order                  | number  | Não         |
| end_date               | date    | Não         |
| start_date             | date    | Não         |
| achieved               | boolean | Não         |
| description            | text    | Não         |
| internal_goal          | project | Não         |
| status                 | os_task_status | Não         |
| current_key_result_value | number  | Não         |

---

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |
| order | unknown | Não | Não |
| end_date | unknown | Não | Não |
| start_date | unknown | Não | Não |
| achieved | unknown | Não | Não |
| description | unknown | Não | Não |
| internal_goal | unknown | Não | Não |
| status | unknown | Não | Não |
| current_key_result_value | unknown | Não | Não |

## internal_project

# internal_project (Data Type)

## Summary
Data type para gerenciar projetos internos, incluindo detalhes como nome, datas, descrição, tempo estimado e status. Possui diferentes permissões de acesso baseadas no tipo de usuário logado.

## Campos

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| name | text | Sim |
| order | number | Não |
| end_date_real | date | Não |
| start_date_real | date | Não |
| description | text | Não |
| real_time | number | Não |
| assignees | list of user | Não |
| estimated_time | number | Não |
| end_date_estimated | date | Não |
| start_date_estimated | date | Não |
| key_results | `custom_task1` | Não |
| status | option set `os_task_status1` | Não |
| sector | option set `os_company_sector` | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |
| order | unknown | Não | Não |
| end_date_real | unknown | Não | Não |
| start_date_real | unknown | Não | Não |
| description | unknown | Não | Não |
| real_time | unknown | Não | Não |
| assignees | unknown | Não | Não |
| estimated_time | unknown | Não | Não |
| end_date_estimated | unknown | Não | Não |
| start_date_estimated | unknown | Não | Não |
| key_results | unknown | Não | Não |
| status | unknown | Não | Não |
| sector | unknown | Não | Não |

## internal_task

# internal_task

## Summary
Este Data Type representa tarefas internas no sistema, armazenando detalhes como nome, descrição, datas de início e fim (estimadas e reais), tempo estimado e real, status, e a quais projetos e metas internas estão associadas. Permite a designação de responsáveis (assignees).

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| name | text | Sim |
| order | number | Não |
| real_end_date | date | Não |
| real_start_date | date | Não |
| description | text | Não |
| real_time | number | Não |
| assignees | list of users | Não |
| estimated_time | number | Não |
| estimated_end_date | date | Não |
| estimated_start_date | date | Não |
| internal_goal | project | Não |
| internal_project | task | Não |
| status | os_internal_task | Não |
| internal_key_result | task | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |
| order | unknown | Não | Não |
| real_end_date | unknown | Não | Não |
| real_start_date | unknown | Não | Não |
| description | unknown | Não | Não |
| real_time | unknown | Não | Não |
| assignees | unknown | Não | Não |
| estimated_time | unknown | Não | Não |
| estimated_end_date | unknown | Não | Não |
| estimated_start_date | unknown | Não | Não |
| internal_goal | unknown | Não | Não |
| internal_project | unknown | Não | Não |
| status | unknown | Não | Não |
| internal_key_result | unknown | Não | Não |

## company

# company (Data Type)

## Summary
Este Data Type representa informações de empresas, armazenando o nome e o website. As permissões de acesso variam entre usuários "everyone" e administradores/gerentes/operacionais.

## Campos

| Campo     | Tipo   | Obrigatório |
|-----------|--------|-------------|
| name      | text   | Não         |
| website   | text   | Não         |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |
| website | unknown | Não | Não |

## project

# project (Data Type)

## Summary
Este data type representa um projeto, contendo informações como nome, datas, valores financeiros, usuários autorizados e status.

## Campos

| Campo                              | Tipo                           | Obrigatório |
|------------------------------------|--------------------------------|-------------|
| name                               | text                           | Não         |
| price                              | number                         | Não         |
| end_date_real                      | date                           | Não         |
| picture                            | image                          | Não         |
| profit                             | number                         | Não         |
| referrer                           | user                           | Não         |
| start_date_real                    | date                           | Não         |
| description                        | text                           | Não         |
| real_time                          | number                         | Não         |
| referrer_commission                | number                         | Não         |
| estimated_time                     | number                         | Não         |
| end_date_estimated                 | date                           | Não         |
| referrer_revenue                   | number                         | Não         |
| start_date_estimated               | date                           | Não         |
| authorized_users                   | list.user                      | Não         |
| stage                              | option.os_project_stage        | Não         |
| program                            | option.os_project_type         | Não         |
| status                             | option.os_project_status       | Não         |
| change_automatically_project_estimated_time | boolean                        | Não         |
| company_that_recommended_this_project | custom.company                 | Não         |
| change_automatically_milestone_estimated_time | boolean                        | Não         |
| company_which_recommended_this_project (deleted) | custom.company                 | Não         |
| talent_who_recommended_this_project | custom.professional            | Não         |
| change_automatically_project_start_and_end_dates | boolean                        | Não         |
| client_who_recommended_this_project | custom.talent_client           | Não         |
| change_automatically_milestone_start_and_end_dates | boolean                        | Não         |

## Permissões de Privacidade

### everyone
- Visualizar Todos: Não
- Pesquisar: Não
- Auto Binding: Não
- Visualizar Anexos: Não

### Current user is referrer
- Condição: `Current User` E `type_option_os_user_type` = `referrer` E `referrer_user` = `Current User`
- Visualizar Todos: Não
- Pesquisar: Sim
- Visualizar Campos:
    - referrer_commission
    - name
    - profit
    - referrer
    - status
    - company_that_recommended_this_project
    - picture
    - referrer_revenue
    - price
- Auto Binding: Não
- Visualizar Anexos: Sim

### Current user is admin or manager
- Condição: `Current User` E (`type_option_os_user_type` = `admin` OU `type_option_os_user_type` = `manager`)
- Visualizar Todos: Sim
- Pesquisar: Sim
- Auto Binding: Não
- Visualizar Anexos: Sim

### Current user is developer or client or qa
- Condição: `Current User` E (`type_option_os_user_type` = `developer` OU `type_option_os_user_type` = `client` OU `type_option_os_user_type` = `qa`)
- Visualizar Todos: Não
- Pesquisar: Sim
- Visualizar Campos:
    - name
    - price
    - end_date_real
    - picture
    - profit
    - referrer
    - start_date_real
    - description
    - real_time
    - referrer_commission
    - estimated_time
    - end_date_estimated
    - referrer_revenue
    - start_date_estimated
    - authorized_users
    - stage
    - program
    - status
    - change_automatically_project_estimated_time
    - company_that_recommended_this_project
    - change_automatically_milestone_estimated_time
    - talent_who_recommended_this_project
    - change_automatically_project_start_and_end_dates
    - client_who_recommended_this_project
    - change_automatically_milestone_start_and_end_dates
- Auto Binding: Não
- Visualizar Anexos: Sim

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |
| price | unknown | Não | Não |
| end_date_real | unknown | Não | Não |
| picture | unknown | Não | Não |
| profit | unknown | Não | Não |
| referrer | unknown | Não | Não |
| start_date_real | unknown | Não | Não |
| description | unknown | Não | Não |
| real_time | unknown | Não | Não |
| referrer_commission | unknown | Não | Não |
| estimated_time | unknown | Não | Não |
| end_date_estimated | unknown | Não | Não |
| referrer_revenue | unknown | Não | Não |
| start_date_estimated | unknown | Não | Não |
| authorized_users | unknown | Não | Não |
| stage | unknown | Não | Não |
| program | unknown | Não | Não |
| status | unknown | Não | Não |
| REDACTED | unknown | Não | Não |
| REDACTED | unknown | Não | Não |
| REDACTED | unknown | Não | Não |
| company_which_recommended_this_project - deleted | unknown | Não | Não |
| REDACTED | unknown | Não | Não |
| REDACTED | unknown | Não | Não |
| REDACTED | unknown | Não | Não |
| REDACTED | unknown | Não | Não |

## feedback

# feedback (Data Type)

## Summary
Este Data Type armazena informações de feedback, incluindo o texto do comentário, uma avaliação numérica, o projeto associado e o tipo de usuário que forneceu o feedback.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| comment | text | Não |
| rating | number | Não |
| project | project | Não |
| user_type | os_user_type | Não |

---

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| comment | unknown | Não | Não |
| rating | unknown | Não | Não |
| project | unknown | Não | Não |
| user_type | unknown | Não | Não |

## idea_icp

# idea_icp

## Summary
Este Data Type representa um Perfil de Cliente Ideal (ICP) associado a uma ideia. Foi desativado e pode não estar mais em uso.

## Campos

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| name | text | Não |
| problem - deleted | text | Não |
| description | text | Não |
| authorized_users | list of User | Não |
| idea | Idea Plan | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |
| problem - deleted | unknown | Não | Não |
| description | unknown | Não | Não |
| authorized_users | unknown | Não | Não |
| idea | unknown | Não | Não |

## internal_goal

# internal_goal (Data Type)

## Summary
Define as metas internas de um projeto. Possui campos para nome, ordem, descrição e status.

## Campos

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| name | text | Não |
| order | number | Não |
| description | text | Não |
| status | os_project_status (Option Set) | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |
| order | unknown | Não | Não |
| description | unknown | Não | Não |
| status | unknown | Não | Não |

## qa_milestone_total

# qa_milestone_total (Data Type)

## Summary
Define os totais de tempo estimado e real para tarefas de QA e desenvolvedores, associando-as a um projeto e tarefa específicos. Inclui campos para controle de usuários autorizados e um nome para a tarefa.

## Campos

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| task_milestone | custom | Não |
| developer_real_time_h | number | Não |
| qa_real_time_h | number | Não |
| project | custom | Não |
| developer_estimated_time_h | number | Não |
| name | option | Não |
| authorizes_users | list of user | Não |
| qa_estimated_time_h | number | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| task_milestone | unknown | Não | Não |
| developer_real_time_h | unknown | Não | Não |
| qa_real_time_h | unknown | Não | Não |
| project | unknown | Não | Não |
| developer_estimated_time_h | unknown | Não | Não |
| name | unknown | Não | Não |
| authorizes_users | unknown | Não | Não |
| qa_estimated_time_h | unknown | Não | Não |

## idea

# idea (Data Type)

## Summary
Este Data Type representa uma ideia com detalhes como nome, pontuação, descrição e métricas de sucesso. Ele também gerencia associações com projetos e usuários autorizados.

## Campos

| Campo                       | Tipo   | Obrigatório |
|-----------------------------|--------|-------------|
| name                        | text   | Sim         |
| score                       | number | Sim         |
| description                 | text   | Sim         |
| main_problem - deleted      | text   | Não         |
| success_metrics             | text   | Sim         |
| project                     | project| Sim         |
| ai_status - deleted         | ai_status (option set) | Não |
| authorized_users            | user (list) | Não |
| current_block_ended         | os_idea_block (option

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |
| score | unknown | Não | Não |
| description | unknown | Não | Não |
| main_problem - deleted | unknown | Não | Não |
| success_metrics | unknown | Não | Não |
| project | unknown | Não | Não |
| ai_status - deleted | unknown | Não | Não |
| authorized_users | unknown | Não | Não |
| current_block_ended | unknown | Não | Não |
| current_blocks_updating | unknown | Não | Não |

## sop_tag

# sop_tag

## Summary
Este Data Type representa as tags associadas aos SOPs, permitindo categorização e organização.

## Campos

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| name | text | Sim |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |

## time_track

# time_track

## Summary
Este DataType armazena informações sobre o rastreamento de tempo de usuários em tarefas e projetos, incluindo proprietário, datas, horários e tempo total decorrido.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| owner | User | Não |
| end_time_min | number | Não |
| start_date | date | Não |
| task | Task | Não |
| start_time_min | number | Não |
| time_spent_h | number | Não |
| project | Project | Não |
| authorized_users | User (list) | Não |

## Privacidade

| Regra de Privacidade | Permissões |
|---|---|
| everyone | View all: Não, Search for: Não, Auto binding: Não, View attachments: Não |
| Current user is admin or manager | View all: Sim, Search for: Sim, Auto binding: Sim, Binding fields: time_spent_h, end_date, start_date, owner, start_time, end_time, end_time_min, start_time_min, View attachments: Sim |
| Current user is developer or client or qa | View all: Sim, Search for: Sim, Auto binding: Sim, Binding fields: time_spent_h, end_date, start_date, owner, end_time, start_time, end_time_min, start_time_min, View attachments: Sim |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| owner | unknown | Não | Não |
| end_time_min | unknown | Não | Não |
| start_date | unknown | Não | Não |
| task | unknown | Não | Não |
| start_time_min | unknown | Não | Não |
| time_spent_h | unknown | Não | Não |
| project | unknown | Não | Não |
| authorized_users | unknown | Não | Não |

## project_file

# project_file (Data Type)

## Summary
Representa um arquivo associado a um projeto, contendo um nome, arquivos relacionados, o projeto ao qual pertence e uma lista de usuários autorizados.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| name | text | Sim |
| files | list of file | Não |
| project | project | Sim |
| authorized_users | list of user | Não |
| authorized_users_types - deleted | REDACTED | Não (Campo deletado) |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |
| files | unknown | Não | Não |
| project | unknown | Não | Não |
| authorized_users | unknown | Não | Não |
| authorized_users_types - deleted | unknown | Não | Não |

## sop_version

# sop_version

## Summary
Este DataType armazena informações e o conteúdo de versões de Procedimentos Operacionais Padrão (SOPs). Possui campos para o conteúdo em texto, nome da versão, um link para o SOP principal e listas de usuários autorizados.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| content | text | Não |
| version_name | text | Sim |
| sop | sop | Sim |
| authorized_users | list of user | Não |
| authorized_users_types | list of os_user_type | Não |

## Privacy Rules

| Regra | Condição | Permissões |
|---|---|---|
| everyone | N/A | Nenhuma permissão |
| Current user is admin or manager | Current user is admin OR Current user is manager | view all, search for, view attachments |
| This SOP contains authorized current user | Current User is in 'authorized_users' | view all, search for, view attachments |
| This SOP contains current user type | Current User is in 'authorized_users_types' | view all, search for, view attachments |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| content | unknown | Não | Não |
| version_name | unknown | Não | Não |
| sop | unknown | Não | Não |
| authorized_users | unknown | Não | Não |
| authorized_users_types | unknown | Não | Não |

## talent_tool

# talent_tool

## Summary
Data type que armazena informações sobre o score e as ferramentas associadas a um profissional. Contém campos para score numérico, a ferramenta utilizada (option set) e o profissional em questão (custom data type).

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| score | number | Não |
| tool | option.os_tool_stack | Não |
| talent | custom.professional | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| score | unknown | Não | Não |
| tool | unknown | Não | Não |
| talent | unknown | Não | Não |

## internal_time_track

# internal_time_track

## Summary
Este tipo de dado representa o registro de tempo de uma tarefa ou projeto interno. Ele armazena informações sobre o responsável, o período de tempo registrado e o tempo total dedicado.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| owner | User | Sim |
| end_time_min | number | Não |
| start_date | date | Não |
| start_time_min | number | Não |
| time_spent_h | number | Não |
| internal_task | custom.task3 | Não |
| internal_project | custom.task2 | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| owner | unknown | Não | Não |
| end_time_min | unknown | Não | Não |
| start_date | unknown | Não | Não |
| start_time_min | unknown | Não | Não |
| time_spent_h | unknown | Não | Não |
| internal_task | unknown | Não | Não |
| internal_project | unknown | Não | Não |

## qa_time_track

# qa_time_track

## Summary
Este Data Type armazena o registro de tempo de qualidade (QA) para tarefas e projetos. Ele inclui detalhes como o usuário proprietário, datas e horários de início e fim, tempo gasto e status de pagamento.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| owner_user | user | Não |
| paid_boolean | boolean | Não |
| end_time_min | number | Não |
| start_date | date | Não |
| task | task | Não |
| start_time_min | number | Não |
| time_spent_h | number | Não |
| project | project | Não |
| authorized_users | user (list) | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| owner | unknown | Não | Não |
| paid | unknown | Não | Não |
| end_time_min | unknown | Não | Não |
| start_date | unknown | Não | Não |
| task | unknown | Não | Não |
| start_time_min | unknown | Não | Não |
| time_spent_h | unknown | Não | Não |
| project | unknown | Não | Não |
| authorized_users | unknown | Não | Não |

## talent

# Talent

## Summary
Este DataType armazena informações de talentos, incluindo dados de contato, detalhes profissionais e histórico de referências.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| code | text | Não |
| name | text | Não |
| email | text | Não |
| phone | text | Não |
| linkedin | text | Não |
| picture | image | Não |
| portfolio | text | Não |
| user_account | user | Não |
| country | option.os_country | Não |
| current_job_position | text | Não |
| level | option.os_talent_level | Não |
| current_company | company | Não |
| tools | option.os_tool_stack | Não |
| referred_by | professional | Não |
| authority_level | option.os_authority_level | Não |
| programming_languages | option.os_programming_language | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| code | unknown | Não | Não |
|  name | unknown | Não | Não |
| email | unknown | Não | Não |
| phone | unknown | Não | Não |
| linkedin | unknown | Não | Não |
| picture | unknown | Não | Não |
| portfolio | unknown | Não | Não |
| user_account | unknown | Não | Não |
| country | unknown | Não | Não |
| current_job_position | unknown | Não | Não |
| level | unknown | Não | Não |
| current_company | unknown | Não | Não |
| tools | unknown | Não | Não |
| referred_by | unknown | Não | Não |
| authority_level | unknown | Não | Não |
| programming_languages | unknown | Não | Não |

## project_link

# project_link

## Summary
Este DataType armazena informações sobre links de projetos, incluindo URL, nome e usuários autorizados. Possui regras de privacidade para controlar o acesso.

## Campos

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| url | text | Sim |
| name | text | Sim |
| project | project | Sim |
| authorized_users | list of user | Não |
| authorized_users_types - deleted | RECARED | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| url | unknown | Não | Não |
| name | unknown | Não | Não |
| project | unknown | Não | Não |
| authorized_users | unknown | Não | Não |
| authorized_users_types - deleted | unknown | Não | Não |

## task_comment

# task_comment

## Summary
Este DataType representa os comentários associados a uma tarefa. Ele armazena o texto do comentário, arquivos anexados, o usuário que o publicou e a tarefa à qual pertence.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| owner | user | Sim |
| message | text | Não |
| files | list.file | Não |
| task | task | Sim |
| viewed_by | list.user | Não |
| project | project | Não |
| authorized_users | list.user | Não |

---

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| owner | unknown | Não | Não |
| message | unknown | Não | Não |
| files | unknown | Não | Não |
| task | unknown | Não | Não |
| viewed_by | unknown | Não | Não |
| project | unknown | Não | Não |
| authorized_users | unknown | Não | Não |

## project_video

# project_video

## Summary
Este Data Type armazena informações sobre vídeos associados a projetos, incluindo URL, nome, projeto ao qual pertence e usuários autorizados.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| url | text | Não |
| name | text | Não |
| project | project | Não |
| authorized_users | list of user | Não |

---

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| url | unknown | Não | Não |
| name | unknown | Não | Não |
| project | unknown | Não | Não |
| authorized_users | unknown | Não | Não |
| authorized_users_types - deleted - deleted | unknown | Não | Não |

## client

# client (Data Type)

## Summary
Define a estrutura de dados para armazenar informações de clientes, incluindo nome, contato e país.

## Campos

| Campo   | Tipo   | Obrigatório |
|---------|--------|-------------|
| name    | text   | Não         |
| email   | text   | Não         |
| phone   | text   | Não         |
| linkedin| text   | Não         |
| picture | image  | Não         |
| country | option | Não         |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |
| email | unknown | Não | Não |
| phone | unknown | Não | Não |
| linkedin | unknown | Não | Não |
| picture | unknown | Não | Não |
| country | unknown | Não | Não |

## project_playbook_version

# project_playbook_version

## Summary
Este DataType representa as versões de play

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| content | unknown | Não | Não |
| version_name | unknown | Não | Não |
| google_docs_url | unknown | Não | Não |
| project | unknown | Não | Não |
| authorized_users | unknown | Não | Não |

## idea_user_type

# idea_user_type

## Summary
Este DataType representa um tipo de usuário para uma ideia, contendo informações como nome, fluxos de usuário, descrição e os usuários autorizados a visualizá-lo.

## Campos

| Campo                                              | Tipo   | Obrigatório |
|----------------------------------------------------|--------|-------------|
| name                                               | text   | Sim         |
| flows                                              | text   | Não         |
| description                                        | text   | Não         |
| authorized_users                                   | user   | Não         |
| idea                                               | idea_plan | Não         |

---

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |
| problem - deleted | unknown | Não | Não |
| flows | unknown | Não | Não |
| description - deleted | unknown | Não | Não |
| description | unknown | Não | Não |
| authorized_users | unknown | Não | Não |
| idea | unknown | Não | Não |
| idea_block_product_definition_and_flows - deleted | unknown | Não | Não |

## prompt

# prompt (Data Type)

## Summary
Este Data Type representa informações relacionadas a um "prompt" ou instrução, possivelmente usado em um contexto de geração de texto ou ideias. Contém campos para diferentes versões do prompt e campos marcados como deletados que referenciam opções ou tipos customizados.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| type | text | Não |
| prompt_1 | text | Não |
| prompt_2 | text | Não |
| prompt_3 | text | Não |
| block - deleted <sup>(deletado)</sup> | os_idea_block | Não |
| block - deleted <sup>(deletado)</sup> | idea_prompt_block | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| type | unknown | Não | Não |
| prompt_1 | unknown | Não | Não |
| prompt_2 | unknown | Não | Não |
| prompt_3 | unknown | Não | Não |
| block - deleted | unknown | Não | Não |
| block - deleted | unknown | Não | Não |

## project_agreement_version

# project_agreement_version

## Summary
Este DataType representa as versões de um acordo de projeto, armazenando seu conteúdo, URL do Google Docs, tipo e status. Inclui campos para usuários autorizados e relações com projetos.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| name | text | Não |
| content | text | Não |
| google_docs_url | text | Não |
| project | project | Não |
| authorized_users | list of user | Não |
| type | option set (os_agreement_type) | Não |
| status | option set (os_agreement_status) | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |
| content | unknown | Não | Não |
| google_docs_url | unknown | Não | Não |
| ready_to_be_signed - deleted | unknown | Não | Não |
| project | unknown | Não | Não |
| signed_by_admin - deleted | unknown | Não | Não |
| signed_by_client - deleted | unknown | Não | Não |
| authorized_users | unknown | Não | Não |
| type | unknown | Não | Não |
| available_to_client_sign - deleted | unknown | Não | Não |
| status | unknown | Não | Não |
| authorized_users_types - deleted | unknown | Não | Não |

## REDACTED

# talent_referred_by

## Summary
Este Data Type armazena informações sobre quais talentos foram indicados e por quem. Ele é usado para rastrear indicações com detalhes como código, pontuação e nível de experiência do talento.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| code | text | Não |
| score | number | Não |
| description | text | Não |
| talent | custom.professional | Não |
| level | option.os_talent_level | Não |
| referred_by | custom.professional | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| code | unknown | Não | Não |
| score | unknown | Não | Não |
| description | unknown | Não | Não |
| talent | unknown | Não | Não |
| level | unknown | Não | Não |
| referred_by | unknown | Não | Não |

## idea_prompt_field

# idea_prompt_field

## Summary
Este Data Type, agora marcado como deletado, continha campos para armazenar um texto de prompt e uma opção relacionada a um campo de ideia de negócio.

## Campos

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| prompt | text | Não |
| field | option.os_business_idea_field | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| prompt | unknown | Não | Não |
| field | unknown | Não | Não |

## client_milestone_total

# client_milestone_total

## Summary
Define as informações de marcos de um cliente, incluindo estimativas de tempo, tempo real, o nome da tarefa associada e usuários autorizados.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| task_milestone | custom.task | Não |
| real_time_h | number | Não |
| project | custom.project | Não |
| estimated_time_h | number | Não |
| name | option.os_task_name | Não |
| authorizes_users | list.user | Não |

## Permissões de Privacidade

### Everyone
| Permissão | Permitido |
|---|---|
| View all | Não |
| Search for | Não |
| Auto-binding | Não |
| View attachments | Não |

### Current user is admin or manager
**Condição:** O tipo de usuário do usuário atual é "admin" OU "manager".
| Permissão | Permitido | Campos Vinculáveis |
|---|---|---|
| View all | Sim | estimated_time_h, name, real_time_h |
| Search for | Sim | - |
| Auto-binding | Sim | - |
| View attachments | Sim | - |

### Current user is developer or client or QA
**Condição:** O tipo de usuário do usuário atual é "developer" OU "client" OU "qa" E o usuário atual está na lista `authorizes_users`.
| Permissão | Permitido | Campos Vinculáveis |
|---|---|---|
| View all | Sim | name, real_time_h, estimated_time_h |
| Search for | Sim | - |
| Auto-binding | Sim | - |
| View attachments | Sim | - |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| task_milestone | unknown | Não | Não |
| real_time_h | unknown | Não | Não |
| project | unknown | Não | Não |
| estimated_time_h | unknown | Não | Não |
| name | unknown | Não | Não |
| authorizes_users | unknown | Não | Não |

## internal_key_result_track

# internal_key_result_track

## Summary
Este DataType armazena o rastreamento de progresso de Key Results internas, incluindo a data, o valor alcançado, o status de conclusão e os links relacionados a um objetivo interno e um Key Result específico.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| date | date | Sim |
| value | number | Não |
| achieved | boolean | Não |
| internal_goal | project1 | Não |
| internal_key_result | task1 | Não |
| current_target_key_result_value | number | Não |

---

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| date | unknown | Não | Não |
| value | unknown | Não | Não |
| achieved | unknown | Não | Não |
| internal_goal | unknown | Não | Não |
| internal_key_result | unknown | Não | Não |
| REDACTED | unknown | Não | Não |

## project_agreement_template

# project_agreement_template (Data Type)

## Summary
Define os modelos de acordo para projetos, contendo o conteúdo textual e o tipo de acordo.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| content | text | Sim |
| type | option.os_agreement_type | Sim |

---

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| content | unknown | Não | Não |
| type | unknown | Não | Não |

## project_daily_feedback

# project_daily_feedback

## Summary
Este Data Type armazena o feedback diário de projetos, incluindo data, bloqueios, trabalho realizado e planejado, links e usuários autorizados.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| date | date | Sim |
| blockers | text | Não |
| video_and_links | text | Não |
| today_work | text | Não |
| tomorrow_work | text | Não |
| project | project | Não |
| authorized_users | list of user | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| date | unknown | Não | Não |
| blockers | unknown | Não | Não |
| video_and_links | unknown | Não | Não |
| today_work | unknown | Não | Não |
| tomorrow_work | unknown | Não | Não |
| project | unknown | Não | Não |
| authorized_users | unknown | Não | Não |

## talent_programming_language

# talent_programming_language

## Summary
Este DataType armazena a pontuação de uma linguagem de programação para um profissional, vinculando o profissional e a linguagem de programação escolhida.

## Campos

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| score | number | Não |
| talent | custom.professional | Não |
| programming_language | option.os_programming_language | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| score | unknown | Não | Não |
| talent | unknown | Não | Não |
| programming_language | unknown | Não | Não |

## idea_optimization_suggestion

# idea_optimization_suggestion

## Summary
Este Data Type armazena sugestões de otimização para ideias, incluindo nome, descrição, a ideia associada, usuários autorizados e o ICP (Ideal Customer Profile) relacionado.

## Campos

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| name | text | Não |
| description | text | Não |
| idea | idea_plan | Não |
| authorized_users | list of user | Não |
| icp | business_idea_strategic_framework | Não |

---

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |
| description | unknown | Não | Não |
| idea | unknown | Não | Não |
| authorized_users | unknown | Não | Não |
| icp | unknown | Não | Não |

## REDACTED

# client_who_referred_this_talent (Data Type)

## Summary
Este Data Type armazena informações sobre clientes que indicaram talentos, incluindo um código, descrição, pontuação e dados relacionados ao talento e ao cliente. Define permissões de acesso para diferentes tipos de usuários.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| code | text | Não |
| score | number | Não |
| description | text | Não |
| talent | custom.professional | Não |
| client | custom.talent_client | Não |
| level | option.os_talent_level | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| code | unknown | Não | Não |
| score | unknown | Não | Não |
| description | unknown | Não | Não |
| talent | unknown | Não | Não |
| client | unknown | Não | Não |
| level | unknown | Não | Não |

## idea_icp

# idea_icp

## Summary
Este Data Type representa um Perfil de Cliente Ideal (ICP) associado a uma ideia de negócio. Ele armazena detalhes do cliente, como suas dores, ganhos e dados demográficos.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| jtbd | text | Não |
| name | text | Não |
| title | text | Não |
| day_in_life | text | Não |
| score | number | Não |
| picture | image | Não |
| subtitle | text | Não |
| tags | list.text | Não |
| pitch_need | text | Não |
| description | text | Não |
| pain_points | text | Não |
| firmographics | text | Não |
| pitch_benefit | text | Não |
| pitch_approach | text | Não |
| psychographics | text | Não |
| pitch_competition | text | Não |
| authorized_users | list.user | Não |
| value_proposition_icp_pains | text | Não |
| value_proposition_icp_gains | text | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| jtbd | unknown | Não | Não |
| name | unknown | Não | Não |
| title | unknown | Não | Não |
| day_in_life | unknown | Não | Não |
| score | unknown | Não | Não |
| picture | unknown | Não | Não |
| subtitle | unknown | Não | Não |
| tags | unknown | Não | Não |
| version - deleted | unknown | Não | Não |
| pitch_need | unknown | Não | Não |
| description - deleted | unknown | Não | Não |
| pain_points | unknown | Não | Não |
| description | unknown | Não | Não |
| firmographics | unknown | Não | Não |
| pitch_benefit | unknown | Não | Não |
| icp - deleted | unknown | Não | Não |
| pitch_approach | unknown | Não | Não |
| psychographics | unknown | Não | Não |
| pitch_competition | unknown | Não | Não |
| authorized_users | unknown | Não | Não |
| value_proposition_icp_pains | unknown | Não | Não |
| idea | unknown | Não | Não |
| persona - deleted | unknown | Não | Não |
| field - deleted | unknown | Não | Não |
| REDACTED | unknown | Não | Não |
| value_proposition_icp_gains | unknown | Não | Não |
| REDACTED | unknown | Não | Não |

## REDACTED

# DataType Idea Block Product Definition And Flows

## Summary
Este DataType representa as definições de produto e fluxos de uma ideia. Ele armazena informações de resumo, funcionalidades e os detalhes do plano da ideia, além de gerenciar os usuários autorizados.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| summary | text | Não |
| features | text | Não |
| idea | custom.idea_plan | Não |
| authorized_users | list.user | Não |

---

### Para PRIVACY ROLES:

# Idea Block Product Definition And Flows - Privacy Rules

## Summary
Regras de privacidade definidas para o DataType "Idea Block Product Definition And Flows", controlando quem pode visualizar, pesquisar e interagir com seus dados.

## Regras

| Nome da Regra                                         | Permissões    | Condição                                                                                                                                                                                                                                                                                                                      |
| :---------------------------------------------------- | :------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **everyone**                                          | View all: Não, Search for: Não, Auto binding: Não, View attachments: Não | N/A                                                                                                                                                                                                                                                                                             |
| **Current user is authorized to see this idea**       | View all: Sim, Search for: Sim, Auto binding: Não, View attachments: Sim | *Current User* contains *authorized_users*                                                                                                                                                                                                                                                        |
| **Current user is admin or manager**                  | View all: Sim, Search for: Sim, Auto binding: Não, View attachments: Sim | (*Current User*'s *type_option_os_user_type* equals *option.os_user_type:admin*) OR (*Current User*'s *type_option_os_user_type* equals *option.os_user_type:manager*)                                                                                                                                      |
| **Idea's owner**                                      | View all: Sim, Search for: Sim, Auto binding: Não, View attachments: Sim | *Current User* equals *Created By*                                                                                                                                                                                                                                                            |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| summary | unknown | Não | Não |
| features | unknown | Não | Não |
| idea | unknown | Não | Não |
| authorized_users | unknown | Não | Não |

## idea_block_structure_and_align

# idea_block_structure_and_align (Data Type)

## Summary
Este Data Type representa a estrutura de blocos para a definição de ideias de negócios, focando em clareza e alinhamento. Ele armazena informações sobre métricas de sucesso, público-alvo e funcionalidades essenciais.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| success_metrics_text | text | Não |
| product_overview_text | text | Não |
| essential_features_text | text | Não |
| authorized_users_list_user | list of User | Não |
| business_idea_custom_idea_plan | idea_plan | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| version - deleted | unknown | Não | Não |
| user_flows - deleted | unknown | Não | Não |
| success_metrics | unknown | Não | Não |
| target_audience | unknown | Não | Não |
| core_problem | unknown | Não | Não |
| authorized_users | unknown | Não | Não |
| idea | unknown | Não | Não |
| field - deleted | unknown | Não | Não |

---

