# Backlog de Tarefas — Weather App

Tarefas derivadas de [weather-app-plan.md](../plans/weather-app-plan.md). A ordem de execução é definida pelas entregas e dependências, não pelo número do ID; os IDs permanecem estáveis para preservar referências. Os critérios de aceite devem ser verificáveis por compilação, inspeção de resposta ou teste; a matriz final associa cada tarefa aos IDs FR/AC/NFR aplicáveis ou ao plano técnico quando não há requisito de produto direto. Cada tarefa fica restrita a um fluxo e, em geral, a até dois arquivos relevantes.

## Entrega 1 — Infraestrutura, tipos e funções puras

### T-01 — Adicionar Fastify ao workspace
- **Tipo:** Infra
- **Descrição:** Incluir Fastify como dependência de runtime do backend.
- **Critérios de aceite:** `fastify` está em `dependencies`; `pnpm install --frozen-lockfile` termina sem alterar o lockfile; nenhuma dependência de runtime além do Fastify é adicionada.
- **Dependências:** —
- **Arquivos prováveis:** `package.json`, `pnpm-lock.yaml`

### T-02 — Configurar compilação TypeScript do backend
- **Tipo:** Infra
- **Descrição:** Definir a configuração TypeScript que compila o servidor sem misturar módulos Node ao bundle do navegador.
- **Critérios de aceite:** `pnpm exec tsc -b tsconfig.server.json` termina sem erros; `pnpm build` compila o cliente sem importar módulos de `server/`; `tsconfig.json` referencia as configurações de cliente e servidor sem incluir fontes Node no projeto do browser.
- **Dependências:** T-01
- **Arquivos prováveis:** `tsconfig.json`, `tsconfig.server.json`

### T-03 — Criar scripts de execução e build do servidor
- **Tipo:** Infra
- **Descrição:** Adicionar comandos do workspace para iniciar o servidor em desenvolvimento, compilar e executar a versão de produção.
- **Critérios de aceite:** `pnpm dev:server`, `pnpm build:server` e `pnpm start:server` executam os comandos configurados sem erro; `pnpm build` continua compilando o frontend.
- **Dependências:** T-01, T-02
- **Arquivos prováveis:** `package.json`

### T-04 — Encaminhar `/api` pelo Vite
- **Tipo:** Infra
- **Descrição:** Configurar o proxy de desenvolvimento para encaminhar chamadas `/api` ao Fastify.
- **Critérios de aceite:** com um servidor mock no destino configurado, `GET /api/test` retorna pelo Vite o status/corpo sentinela do mock; `GET /` continua sendo respondido pelo Vite.
- **Dependências:** T-03
- **Arquivos prováveis:** `vite.config.ts`

### T-05 — Definir contratos compartilhados
- **Tipo:** Data
- **Descrição:** Criar tipos para domínio meteorológico, unidade e erros usados pelo cliente e backend.
- **Critérios de aceite:** os tipos exportam os campos e unions definidos no plano; temperatura, código, horário, umidade, vento, precipitação, pressão e dados diários ausentes aceitam `null`; uma compilação TypeScript strict do cliente e servidor termina sem erro.
- **Dependências:** T-02
- **Arquivos prováveis:** `shared/weather-contracts.ts`

### T-06 — Implementar conversão de temperatura
- **Tipo:** Data
- **Descrição:** Criar função pura para formatar valores Celsius ou Fahrenheit, mantendo Celsius como unidade canônica.
- **Critérios de aceite:** testes afirmam `0 °C → 32 °F`, `20 °C → 68 °F`, `10 °C → 50 °F` e `-40 °C → -40 °F`; incluem empates positivos e negativos arredondados para longe de zero; `null` permanece indisponível e a função não faz I/O.
- **Dependências:** T-05
- **Arquivos prováveis:** `src/lib/temperature.ts`

### T-07 — Mapear códigos meteorológicos WMO
- **Tipo:** Data
- **Descrição:** Mapear códigos WMO para descrições em pt-BR.
- **Critérios de aceite:** lookup do código `0` retorna exatamente “Céu limpo”; todo código presente no mapa retorna string não vazia em pt-BR; código não mapeado retorna exatamente “Condição indisponível” e não retorna o número bruto.
- **Dependências:** —
- **Arquivos prováveis:** `src/lib/weatherCodes.ts`

### T-08 — Formatar datas no fuso local
- **Tipo:** Data
- **Descrição:** Criar funções puras de formatação de datas e horários no fuso IANA recebido.
- **Critérios de aceite:** um teste com a mesma data/hora e fusos `America/Sao_Paulo` e `Pacific/Auckland` produz os horários locais esperados em pt-BR, independentemente do fuso do processo; data ou fuso inválido retorna estado inválido em vez de uma data formatada.
- **Dependências:** —
- **Arquivos prováveis:** `src/lib/dateTime.ts`

## Entrega 2 — Services de backend

### T-09 — Implementar transporte Open-Meteo
- **Tipo:** Data
- **Descrição:** Centralizar `fetch`, timeout e classificação de falhas de transporte do provedor.
- **Critérios de aceite:** teste com relógio controlado confirma que a chamada é abortada em 8 segundos; timeout, HTTP indisponível e JSON inválido produzem códigos distintos; uma falha não dispara segunda chamada; logger de teste não recebe query, coordenadas ou corpo upstream.
- **Dependências:** T-01, T-05
- **Arquivos prováveis:** `server/services/openMeteoClient.ts`

### T-10 — Implementar requisição de geocoding
- **Tipo:** Data
- **Descrição:** Construir a chamada Open-Meteo Geocoding com os parâmetros definidos no plano.
- **Critérios de aceite:** URL contém `count=10`, `language=pt` e `format=json`; ao enviar `São Tomé-d'Ávila`, a query decodificada preserva acento, hífen e apóstrofo; a função retorna JSON ao mapeador e não é importada diretamente pela rota.
- **Dependências:** T-09
- **Arquivos prováveis:** `server/services/openMeteoClient.ts`

### T-11a — Consultar previsão na prévia
- **Tipo:** Data
- **Descrição:** Consultar e mapear forecast diretamente para a prévia, sem substituir a integração definitiva pelo backend.
- **Critérios de aceite:** solicita os campos e unidades do plano, associa `city` e retorna cinco datas locais; `current` ou `daily` ausentes geram `WeatherServiceError`; campos ou datas ausentes são nulos e indicam `isPartial`; HTTP e JSON inválido geram erro; testes isolam a rede.
- **Dependências:** T-05
- **Arquivos prováveis:** `src/services/weatherService.ts`

### T-11 — Implementar requisição de previsão
- **Tipo:** Data
- **Descrição:** Construir a chamada Open-Meteo Forecast em Celsius, com fuso automático e cinco dias.
- **Critérios de aceite:** URL contém latitude/longitude, os seis campos `current` e os quatro campos `daily` do plano, `temperature_unit=celsius`, `wind_speed_unit=kmh`, `precipitation_unit=mm`, `timezone=auto` e `forecast_days=5`; a resposta é entregue ao mapeador sem transformação de domínio.
- **Dependências:** T-09
- **Arquivos prováveis:** `server/services/openMeteoClient.ts`

### T-12 — Normalizar resultados de geocoding
- **Tipo:** Data
- **Descrição:** Converter a resposta externa de geocoding em sugestões `City`.
- **Critérios de aceite:** para cada resultado, `id`, `name`, `admin1`, `country`, `country_code`, `latitude` e `longitude` são mapeados para os campos `City` correspondentes; campos opcionais ausentes viram `null`; `results` ausente/nulo retorna `[]`; elemento malformado retorna erro upstream inválido.
- **Dependências:** T-05, T-10
- **Arquivos prováveis:** `server/services/weatherMapper.ts`

### T-13 — Normalizar clima e previsão
- **Tipo:** Data
- **Descrição:** Converter a resposta Forecast para o contrato `WeatherData` sem inventar valores.
- **Critérios de aceite:** timezone, `current.time`, temperatura/código e as quatro métricas atuais, além de cada coluna diária, são mapeados para os campos de contrato correspondentes; ausências viram `null`; a saída tem cinco posições e `isPartial=true` quando qualquer campo/data esperada falta; estrutura sem timezone ou dados utilizáveis é rejeitada.
- **Dependências:** T-05, T-11
- **Arquivos prováveis:** `server/services/weatherMapper.ts`

### T-14 — Implementar rota de localidades
- **Tipo:** Data
- **Descrição:** Criar `GET /api/locations` com validação da query e resposta normalizada.
- **Critérios de aceite:** query vazia ou inválida retorna HTTP 400 com `INVALID_QUERY`; resposta upstream válida sem resultados retorna HTTP 200 e `results: []`; timeout/indisponibilidade não retorna `results: []`; resposta nunca contém campos exclusivos do payload upstream.
- **Dependências:** T-10, T-12
- **Arquivos prováveis:** `server/routes/locations.ts`

### T-15 — Implementar rota de clima
- **Tipo:** Data
- **Descrição:** Criar `GET /api/weather` para consultar coordenadas e retornar clima normalizado.
- **Critérios de aceite:** coordenadas inválidas retornam HTTP 400/`INVALID_QUERY`; sucesso contém timezone, `fetchedAt` ISO UTC, clima atual e cinco posições; timeout retorna HTTP 504/`UPSTREAM_TIMEOUT`; indisponibilidade e JSON inválido retornam os códigos/status definidos sem corpo bruto ou stack trace.
- **Dependências:** T-11, T-13
- **Arquivos prováveis:** `server/routes/weather.ts`

## Entrega 3 — Services do cliente

### T-20a — Consultar geocoding na prévia
- **Tipo:** Data
- **Descrição:** Disponibilizar busca direta Open-Meteo para a prévia, separada do serviço definitivo mediado pelo backend.
- **Critérios de aceite:** nome vazio retorna `[]` sem rede; query é aparada e codificada; resultados são validados e mapeados a `City`; resultados ausentes retornam `[]`; HTTP não-2xx e resposta inválida geram `WeatherServiceError`; transporte direto de busca e previsão usa timeout de 10 s e converte timeout e falha de rede em `WeatherServiceError`, limpando o timer.
- **Dependências:** T-05
- **Arquivos prováveis:** `src/services/weatherService.ts`

### T-20 — Criar service de busca interna
- **Tipo:** Data
- **Descrição:** Implementar a chamada browser para `GET /api/locations`.
- **Critérios de aceite:** teste confirma que `São Tomé-d'Ávila` é a query decodificada enviada a `/api/locations`; HTTP 200 com `results: []` retorna lista vazia; HTTP de erro, rejeição de rede e JSON inválido resultam respectivamente em erro de API, `NETWORK_ERROR` e `INVALID_RESPONSE`; nenhum domínio Open-Meteo é chamado.
- **Dependências:** T-05, T-14
- **Arquivos prováveis:** `src/services/weatherApi.ts`

### T-21 — Criar service de consulta meteorológica
- **Tipo:** Data
- **Descrição:** Implementar a chamada browser para `GET /api/weather`.
- **Critérios de aceite:** teste confirma latitude/longitude na query de `/api/weather`; resposta conforme contrato é aceita; HTTP de erro, rejeição de rede e JSON inválido resultam respectivamente em erro de API, `NETWORK_ERROR` e `INVALID_RESPONSE`; nenhum domínio Open-Meteo é chamado.
- **Dependências:** T-05, T-15
- **Arquivos prováveis:** `src/services/weatherApi.ts`

## Entrega 4 — Hooks

### T-23a — Orquestrar clima na prévia
- **Tipo:** Data
- **Descrição:** Criar hook de prévia usando os serviços diretos, selecionando automaticamente a primeira cidade encontrada.
- **Critérios de aceite:** expõe status, dados, cidades, erro e consulta; busca vazia não acessa rede; resultados vazios geram `empty`; busca com resultado consulta clima da primeira cidade; `selectCity` consulta a cidade informada; retry repete a última operação de busca ou clima; respostas obsoletas não atualizam o estado.
- **Dependências:** T-20a, T-11a
- **Arquivos prováveis:** `src/hooks/useWeather.ts`

### T-22 — Implementar hook de busca
- **Tipo:** Data
- **Descrição:** Controlar validação, busca, sugestões, estado vazio, erro e retry.
- **Critérios de aceite:** testes observam as transições `idle→loading→success`, `idle→loading→empty` e `idle→loading→error`; input de espaços mostra validação e faz zero chamadas; zero resultados não gera erro; retry após falha faz exatamente uma nova chamada.
- **Dependências:** T-20
- **Arquivos prováveis:** `src/hooks/useCitySearch.ts`

### T-23 — Implementar hook de clima
- **Tipo:** Data
- **Descrição:** Controlar seleção da cidade, ciclo da consulta meteorológica e retry.
- **Critérios de aceite:** sem seleção há zero chamadas; selecionar cidade entra em loading e termina em success/error; resposta parcial termina em success; teste com promises controladas seleciona A e depois B e confirma que a resposta tardia de A não substitui B; falha de B não mostra dados de A como atuais.
- **Dependências:** T-21
- **Arquivos prováveis:** `src/hooks/useWeather.ts`

### T-24 — Implementar preferência local de unidade
- **Tipo:** Data
- **Descrição:** Controlar a unidade selecionada e sua persistência no navegador.
- **Critérios de aceite:** armazenamento vazio inicia Celsius; valores `celsius`/`fahrenheit` são restaurados; qualquer outro valor inicia Celsius; `localStorage` que lança exceção ainda permite alternar em memória; mudança de unidade não chama service nem grava dados no servidor.
- **Dependências:** T-05
- **Arquivos prováveis:** `src/hooks/useUnitPreference.ts`

## Entrega 5 — Componentes

### T-25 — Criar campo de busca
- **Tipo:** UI
- **Descrição:** Implementar o campo de texto e envio da busca de cidades.
- **Critérios de aceite:** input tem label associado; Enter chama o callback uma vez com o valor digitado; input permanece editável após validação vazia e erro; teste de teclado não exige apontador.
- **Dependências:** T-22
- **Arquivos prováveis:** `src/components/CitySearch.tsx`

### T-26 — Criar lista de sugestões
- **Tipo:** UI
- **Descrição:** Apresentar e permitir seleção explícita das cidades encontradas.
- **Critérios de aceite:** opções expõem nome acessível com cidade e atributos administrativos disponíveis; setas movem o foco e Enter seleciona a opção focada; renderizar sugestões não invoca o callback de seleção.
- **Dependências:** T-22
- **Arquivos prováveis:** `src/components/CitySuggestions.tsx`

### T-27 — Criar apresentação de status
- **Tipo:** UI
- **Descrição:** Exibir estados de carregamento, vazio, falha e ação de retry.
- **Critérios de aceite:** loading renderiza role `status` com “Carregando...”; vazio renderiza “Cidade não encontrada.”; falha renderiza “Não foi possível concluir a consulta.” e botão “Tentar novamente”; timeout renderiza “A consulta excedeu o tempo limite.”; botão chama o callback uma vez.
- **Dependências:** T-22, T-23
- **Arquivos prováveis:** `src/components/QueryStatus.tsx`

### T-28 — Exibir clima atual
- **Tipo:** UI
- **Descrição:** Apresentar cidade, temperatura atual, ícone e condição, horário de referência disponível e as quatro métricas atuais.
- **Critérios de aceite:** com 18 °C/código WMO 0/Celsius, renderiza cidade selecionada, `18 °C` e “Céu limpo”; exibe umidade em %, vento em km/h, precipitação em mm e pressão à superfície em hPa; código desconhecido mostra “Condição indisponível”; cada campo nulo mostra “Indisponível”; horário nulo não renderiza horário e os dados permanecem associados à cidade do modelo.
- **Dependências:** T-06, T-07, T-23, T-24
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`

### T-29 — Exibir previsão de cinco dias
- **Tipo:** UI
- **Descrição:** Apresentar data, condição, mínima/máxima e probabilidade máxima de precipitação para cada dia local.
- **Critérios de aceite:** renderiza cinco datas consecutivas recebidas; condição e data são formatadas em pt-BR; probabilidade máxima usa % e preserva zero; campo nulo mostra “Indisponível”; `isPartial=true` mostra “Previsão incompleta”.
- **Dependências:** T-06, T-07, T-08, T-23, T-24
- **Arquivos prováveis:** `src/components/ForecastList.tsx`, `src/components/ForecastCard.tsx`

### T-30 — Criar seletor de unidade
- **Tipo:** UI
- **Descrição:** Implementar controle acessível para alternar Celsius e Fahrenheit.
- **Critérios de aceite:** teclado seleciona ambas as opções e a opção ativa é exposta semanticamente; ao alternar, `20 °C` e `10 °C` viram `68 °F` e `50 °F` e todas as demais temperaturas mudam; cidade e datas mantêm os mesmos valores.
- **Dependências:** T-24
- **Arquivos prováveis:** `src/components/UnitSelector.tsx`

## Entrega 6 — Integração da aplicação

### T-16 — Registrar rotas na aplicação Fastify
- **Tipo:** Infra
- **Descrição:** Criar a aplicação Fastify sem iniciar socket, registrando as rotas internas.
- **Critérios de aceite:** `app.inject` recebe resposta nas rotas `/api/locations` e `/api/weather`; criar a aplicação não abre listener; `server/index.ts` não é importado para executar esses testes.
- **Dependências:** T-14, T-15
- **Arquivos prováveis:** `server/app.ts`

### T-17 — Inicializar o servidor Fastify
- **Tipo:** Infra
- **Descrição:** Implementar o ponto de entrada que escuta na configuração de ambiente definida.
- **Critérios de aceite:** `pnpm start:server` inicia o listener usando `HOST` e `PORT` configurados; um teste de processo consegue conectar na porta escolhida e recebe resposta HTTP; o processo encerra sem listener residual.
- **Dependências:** T-03, T-16
- **Arquivos prováveis:** `server/index.ts`

### T-31 — Compor tela principal
- **Tipo:** UI
- **Descrição:** Integrar busca, estados e clima atual em `App` para entregar primeiro um fluxo utilizável.
- **Critérios de aceite:** selecionar uma sugestão chama a consulta com essa cidade; loading/empty/error de busca e loading/error/success do clima atual são renderizados; a cidade e temperatura atual aparecem após sucesso; componentes não chamam `fetch` diretamente.
- **Dependências:** T-22, T-23, T-24, T-25, T-26, T-27, T-28
- **Arquivos prováveis:** `src/App.tsx`

### T-32 — Inicializar aplicação React
- **Tipo:** UI
- **Descrição:** Montar `App` no ponto de entrada React.
- **Critérios de aceite:** `pnpm build` termina com sucesso; a saída contém o entrypoint do frontend e não contém módulos de `server/`; o entrypoint React monta no elemento raiz existente.
- **Dependências:** T-04, T-31
- **Arquivos prováveis:** `src/main.tsx`

### T-56 — Integrar previsão e seletor de unidade
- **Tipo:** UI
- **Descrição:** Estender a tela já utilizável para apresentar a previsão de cinco dias e alternância de unidade.
- **Critérios de aceite:** `App` renderiza `ForecastList` e `UnitToggle`; todas as temperaturas são atualizadas ao alternar unidade; o estado atual de busca/clima, cidade e datas permanece intacto.
- **Dependências:** T-29, T-30, T-31, T-32
- **Arquivos prováveis:** `src/App.tsx`

### T-51 — Ajustar layout para viewport mobile
- **Tipo:** UI
- **Descrição:** Corrigir o layout integrado da tela principal para larguras pequenas.
- **Critérios de aceite:** em viewport de 320 px, busca, botão de envio e seletor de unidade ficam visíveis e operáveis; largura de scroll da página não excede a viewport; bounding boxes de texto e controles não se sobrepõem.
- **Dependências:** T-32, T-56
- **Arquivos prováveis:** `src/App.tsx`, `src/index.css`

## Entrega 7 — Testes de backend, unitários e de componentes

### T-18 — Testar a rota de localidades
- **Tipo:** Test
- **Descrição:** Cobrir `GET /api/locations` com `app.inject` e provedor simulado.
- **Critérios de aceite:** asserts cobrem HTTP 200 com resultados normalizados, HTTP 200 com `results: []`, HTTP 400/`INVALID_QUERY`, HTTP 504/`UPSTREAM_TIMEOUT`, falha upstream e payload inválido; nenhum caso devolve payload ou mensagem interna do provedor.
- **Dependências:** T-16
- **Arquivos prováveis:** `tests/integration/locations.test.ts`

### T-19 — Testar a rota de clima
- **Tipo:** Test
- **Descrição:** Cobrir `GET /api/weather` com `app.inject` e provedor simulado.
- **Critérios de aceite:** asserts cobrem HTTP 200 completo e parcial, HTTP 400/`INVALID_QUERY`, HTTP 504/`UPSTREAM_TIMEOUT`, indisponibilidade e resposta inutilizável; caso parcial mantém cinco posições, usa `null` em campos ausentes e define `isPartial=true`.
- **Dependências:** T-16
- **Arquivos prováveis:** `tests/integration/weather.test.ts`

### T-33 — Testar conversão de temperatura
- **Tipo:** Test
- **Descrição:** Cobrir unitariamente a conversão de temperatura entre Celsius e Fahrenheit e sua regra de arredondamento.
- **Critérios de aceite:** testes unitários afirmam `0 °C→32 °F`, `20 °C→68 °F`, `10 °C→50 °F` e `-40 °C→-40 °F`; incluem empates positivo e negativo arredondados para longe de zero; valor `null` permanece indisponível e não vira zero.
- **Dependências:** T-06
- **Arquivos prováveis:** `tests/unit/temperature.test.ts`

### T-34 — Testar códigos WMO e datas
- **Tipo:** Test
- **Descrição:** Cobrir os mapeamentos de condição e formatação no fuso da cidade.
- **Critérios de aceite:** `weatherCodes.test.ts` afirma código 0, ao menos um código adicional suportado e fallback desconhecido; `dateTime.test.ts` afirma data/hora esperadas usando fuso IANA distinto do fuso do processo.
- **Dependências:** T-07, T-08
- **Arquivos prováveis:** `tests/unit/weatherCodes.test.ts`, `tests/unit/dateTime.test.ts`

### T-35 — Testar service de busca
- **Tipo:** Test
- **Descrição:** Testar serialização e tratamento de respostas do endpoint de localidades.
- **Critérios de aceite:** Vitest substitui o `fetch` global por mock e não acessa a rede; asserts conferem query decodificada `São Tomé-d'Ávila`, retorno `[]` para sucesso vazio, erro de API em status não-2xx, `NETWORK_ERROR` em rejeição e `INVALID_RESPONSE` em JSON inválido.
- **Dependências:** T-20
- **Arquivos prováveis:** `tests/unit/weatherApi.locations.test.ts`

### T-36 — Testar service meteorológico
- **Tipo:** Test
- **Descrição:** Testar serialização e tratamento de respostas do endpoint de clima.
- **Critérios de aceite:** Vitest substitui o `fetch` global por mock e não acessa a rede; asserts conferem latitude/longitude, aceitação de campos meteorológicos nulos, erro de API em status não-2xx, `NETWORK_ERROR` em rejeição e `INVALID_RESPONSE` em contrato inválido.
- **Dependências:** T-21
- **Arquivos prováveis:** `tests/unit/weatherApi.weather.test.ts`

### T-37 — Testar hook de busca
- **Tipo:** Test
- **Descrição:** Verificar transições e retry do fluxo de busca.
- **Critérios de aceite:** asserts observam cada estado `idle/loading/success/empty/error`; query vazia faz zero chamadas; primeira falha seguida de retry resulta em duas chamadas totais e success quando a segunda resposta tem resultados.
- **Dependências:** T-22
- **Arquivos prováveis:** `tests/unit/useCitySearch.test.tsx`

### T-38 — Testar hook de clima
- **Tipo:** Test
- **Descrição:** Verificar consulta, falha, parcialidade e concorrência no hook meteorológico.
- **Critérios de aceite:** service simulado confirma success, error, retry e success parcial; promises controladas concluem B antes de A e o estado final continua associado a B.
- **Dependências:** T-23
- **Arquivos prováveis:** `tests/unit/useWeather.test.tsx`

### T-39 — Testar preferência de unidade
- **Tipo:** Test
- **Descrição:** Verificar inicialização, restauração e atualização da preferência local.
- **Critérios de aceite:** asserts verificam Celsius para storage vazio/inválido, restauração de Fahrenheit, escrita no storage ao alternar e operação em memória quando leitura/escrita lança exceção.
- **Dependências:** T-24
- **Arquivos prováveis:** `tests/unit/useUnitPreference.test.tsx`

### T-40 — Testar busca e sugestões
- **Tipo:** Test
- **Descrição:** Verificar interação e acessibilidade dos componentes de busca e lista.
- **Critérios de aceite:** testes verificam label associado, submit por Enter, edição após estado vazio, opção com estado/país fornecidos e seleção somente após Enter ou click explícito.
- **Dependências:** T-25, T-26
- **Arquivos prováveis:** `tests/unit/CitySearch.test.tsx`, `tests/unit/CitySuggestions.test.tsx`

### T-41 — Testar componente de status em loading, error e empty
- **Tipo:** Test
- **Descrição:** Testar o componente de status nos estados de carregamento, erro e busca vazia.
- **Critérios de aceite:** renderizando `loading`, verifica role `status` e “Carregando...”; renderizando `empty`, verifica “Cidade não encontrada.”; renderizando `error`, verifica “Não foi possível concluir a consulta.”, timeout específico quando aplicável e uma chamada ao callback ao ativar “Tentar novamente”.
- **Dependências:** T-27
- **Arquivos prováveis:** `tests/unit/QueryStatus.test.tsx`

### T-42 — Testar apresentação do clima atual
- **Tipo:** Test
- **Descrição:** Verificar conteúdo e fallback do componente de clima atual.
- **Critérios de aceite:** com fixture de 18 °C/código 0/time definido, verifica `18 °C`, “Céu limpo” e horário; verifica as quatro métricas, suas unidades e zero; com campos nulos verifica “Indisponível” e nenhuma string de horário inventada; código desconhecido mostra fallback.
- **Dependências:** T-28
- **Arquivos prováveis:** `tests/unit/CurrentWeather.test.tsx`

### T-43 — Testar apresentação da previsão
- **Tipo:** Test
- **Descrição:** Verificar cinco datas, valores ausentes e indicador de resposta parcial.
- **Critérios de aceite:** fixture de cinco dias produz cinco itens na ordem recebida; alternar unidade converte mínima e máxima em todos; probabilidade máxima, inclusive zero, é exibida em %; nulos mostram “Indisponível” e partial mostra “Previsão incompleta”.
- **Dependências:** T-29
- **Arquivos prováveis:** `tests/unit/ForecastList.test.tsx`

### T-44 — Testar seletor de unidade
- **Tipo:** Test
- **Descrição:** Verificar teclado, unidade selecionada e callback do controle.
- **Critérios de aceite:** teste de teclado alterna as opções; aria/estado selecionado identifica a unidade ativa; teste de callback observa `fahrenheit` e depois `celsius` exatamente uma vez por ação.
- **Dependências:** T-30
- **Arquivos prováveis:** `tests/unit/UnitSelector.test.tsx`

### T-45 — Testar composição da tela
- **Tipo:** Test
- **Descrição:** Verificar integração dos componentes e callbacks em `App`.
- **Critérios de aceite:** selecionar uma sugestão chama a callback de seleção com a cidade esperada; fixtures de loading/error/success renderizam seus componentes correspondentes; `fetch` é mockado e nenhuma rede real é acessada.
- **Dependências:** T-31
- **Arquivos prováveis:** `tests/unit/App.test.tsx`

## Entrega 8 — Testes E2E e compatibilidade

### T-46 — Testar fluxo principal de consulta
- **Tipo:** Test
- **Descrição:** Automatizar a primeira fatia funcional: busca, seleção e leitura do clima atual.
- **Critérios de aceite:** intercepta todas as chamadas `/api`; executa o mesmo fluxo em viewport desktop e mobile `390×844`; seleciona uma sugestão sem seleção automática anterior; em ambos os viewports, asserts verificam nome da cidade, temperatura e condição atual.
- **Dependências:** T-32
- **Arquivos prováveis:** `tests/e2e/weather-flow.spec.ts`

### T-47 — Testar persistência da unidade no navegador
- **Tipo:** Test
- **Descrição:** Validar alternância para Fahrenheit e restauração após recarregar a página.
- **Critérios de aceite:** valores fixture `20 °C` e `10 °C` aparecem como `68 °F` e `50 °F`; após reload o seletor continua em Fahrenheit; interceptação confirma que não há endpoint de persistência de unidade chamado.
- **Dependências:** T-56
- **Arquivos prováveis:** `tests/e2e/unit-preference.spec.ts`

### T-48 — Testar busca vazia e sem resultados
- **Tipo:** Test
- **Descrição:** Cobrir input só com espaços e busca válida sem localidades.
- **Critérios de aceite:** input só com espaços mostra “Informe uma cidade.” e gera zero chamadas `/api/locations`; resposta HTTP 200 com `results: []` mostra “Cidade não encontrada.” e gera zero chamadas `/api/weather`.
- **Dependências:** T-32
- **Arquivos prováveis:** `tests/e2e/search-empty.spec.ts`

### T-49 — Testar falha, timeout e recuperação
- **Tipo:** Test
- **Descrição:** Verificar mensagens de falha e retry manual nos fluxos de busca e clima.
- **Critérios de aceite:** rotas interceptadas simulam HTTP de falha e timeout; UI mostra mensagem correspondente e “Tentar novamente”; segunda resposta 200 remove o erro e exibe os dados novos.
- **Dependências:** T-32
- **Arquivos prováveis:** `tests/e2e/retry.spec.ts`

### T-50 — Testar descarte de resposta obsoleta
- **Tipo:** Test
- **Descrição:** Validar que uma resposta atrasada de uma cidade anterior não substitui a seleção atual.
- **Critérios de aceite:** rota A fica bloqueada, B responde primeiro e depois A é liberada; após ambas concluírem, nome e clima exibidos continuam sendo os da cidade B.
- **Dependências:** T-32
- **Arquivos prováveis:** `tests/e2e/stale-response.spec.ts`

### T-52 — Testar responsividade mobile
- **Tipo:** Test
- **Descrição:** Validar overflow e visibilidade dos controles em larguras móveis, separadamente do teste funcional principal.
- **Critérios de aceite:** Playwright carrega a tela com resposta meteorológica determinística em `320×568` e `390×844`; em ambos, `scrollWidth <= clientWidth`, controles de busca/unidade estão visíveis e caixas de texto/controles não se sobrepõem.
- **Dependências:** T-46, T-51
- **Arquivos prováveis:** `tests/e2e/responsive.spec.ts`

### T-53 — Registrar validação de compatibilidade
- **Tipo:** Test
- **Descrição:** Validar navegadores suportados e documentar a matriz efetivamente testada.
- **Critérios de aceite:** `docs/browser-compatibility.md` contém uma linha por navegador/plataforma exigidos em NFR-08, com versão, sistema operacional, data e resultado; combinações não executadas estão marcadas como não verificadas, não como aprovadas.
- **Dependências:** T-46, T-47, T-48, T-49, T-50, T-52
- **Arquivos prováveis:** `docs/browser-compatibility.md`

## Entrega 9 — Hardening e prontidão para lançamento

### T-54 — Confirmar condições de uso Open-Meteo
- **Tipo:** Infra
- **Descrição:** Registrar verificação de termos, limites, cobertura, atribuição e disponibilidade do provedor.
- **Critérios de aceite:** `docs/open-meteo-usage.md` registra links/fontes e data da consulta para termos, limites, cobertura, atribuição e disponibilidade; cada item tem decisão ou status pendente; requisito de atribuição aplicável gera uma ação de UI rastreável.
- **Dependências:** T-09, T-31, T-53
- **Arquivos prováveis:** `docs/open-meteo-usage.md`

### T-55 — Executar gates de qualidade
- **Tipo:** Infra
- **Descrição:** Rodar os comandos de lint, build e testes antes da entrega.
- **Critérios de aceite:** os comandos `pnpm lint`, `pnpm build`, `pnpm test` e `pnpm test:e2e` terminam com exit code 0; resultado/data são registrados; execução não realizada ou bloqueada por ambiente fica marcada como não verificada.
- **Dependências:** T-18, T-19, T-33, T-34, T-35, T-36, T-37, T-38, T-39, T-40, T-41, T-42, T-43, T-44, T-45, T-46, T-47, T-48, T-49, T-50, T-52, T-53, T-54, T-56
- **Arquivos prováveis:** `package.json`, `README.md`

## Prioridade e tamanho relativo

Prioridade: **P0** bloqueia a primeira fatia utilizável; **P1** completa o MVP e sua validação funcional; **P2** é hardening/verificação de lançamento, ainda obrigatório antes do release quando indicado. Tamanho: **P** até meio dia; **M** cerca de 1–2 dias; **G** 3+ dias ou maior incerteza/coordenação.

| Tarefa | Prioridade | Tamanho |
| --- | --- | --- |
| T-01 | P0 | P |
| T-02 | P0 | M |
| T-03 | P0 | M |
| T-04 | P0 | P |
| T-05 | P0 | M |
| T-06 | P0 | P |
| T-07 | P0 | P |
| T-08 | P1 | M |
| T-09 | P0 | G |
| T-10 | P0 | P |
| T-11 | P0 | P |
| T-12 | P0 | M |
| T-13 | P0 | G |
| T-14 | P0 | M |
| T-15 | P0 | M |
| T-16 | P0 | M |
| T-17 | P0 | P |
| T-18 | P0 | M |
| T-19 | P0 | M |
| T-20 | P0 | M |
| T-21 | P0 | M |
| T-22 | P0 | G |
| T-23 | P0 | G |
| T-24 | P0 | M |
| T-25 | P0 | P |
| T-26 | P0 | M |
| T-27 | P0 | M |
| T-28 | P0 | M |
| T-29 | P1 | M |
| T-30 | P1 | P |
| T-31 | P0 | M |
| T-32 | P0 | P |
| T-33 | P0 | P |
| T-34 | P1 | M |
| T-35 | P0 | M |
| T-36 | P0 | M |
| T-37 | P0 | M |
| T-38 | P0 | M |
| T-39 | P0 | P |
| T-40 | P0 | M |
| T-41 | P0 | P |
| T-42 | P0 | P |
| T-43 | P1 | M |
| T-44 | P1 | P |
| T-45 | P0 | M |
| T-46 | P0 | G |
| T-47 | P1 | M |
| T-48 | P0 | P |
| T-49 | P0 | M |
| T-50 | P0 | M |
| T-51 | P1 | M |
| T-52 | P1 | M |
| T-53 | P2 | G |
| T-54 | P2 | M |
| T-55 | P2 | M |
| T-56 | P1 | M |

## Sequência proposta em fatias verticais

| Fatia | Entrega visível | Tarefas | Saída verificável |
| --- | --- | --- | --- |
| 1 — Busca e clima atual | Pesquisar e selecionar uma cidade, consultar e exibir condições atuais, com estados de loading/vazio/erro e retry. | T-01–T-07, T-09–T-28, T-31–T-33, T-35–T-42, T-45–T-46, T-48–T-50 | Fluxo E2E de busca e clima atual passa em desktop e mobile `390×844`; não aguardar forecast nem seletor para colocar a primeira tela funcional em uso. |
| 2 — Previsão e unidades | Acrescentar cinco dias locais, conversão C/F e preferência de unidade persistida no navegador. | T-08, T-29–T-30, T-34, T-43–T-44, T-47, T-56 | Previsão tem cinco datas; alternância converte todas as temperaturas e persiste após reload. |
| 3 — Mobile e prontidão de lançamento | Completar responsividade móvel, registrar compatibilidade/condições do provedor e executar gates finais. | T-51–T-55 | Viewports mobile sem overflow; matriz de compatibilidade registrada; condições do provedor e resultados dos gates documentados. |

**Nota de prioridade:** P2 não significa opcional: T-53–T-55 são tarefas de prontidão de lançamento e devem estar concluídas antes do release. A prioridade indica a sequência relativa para alcançar primeiro valor visível.

## Requisitos funcionais → tarefas de implementação

Esta matriz lista tarefas que implementam comportamento do produto; tarefas do tipo `Test` não contam como implementação.

| Requisito funcional | Tarefas implementadoras |
| --- | --- |
| FR-01 — Buscar e selecionar uma cidade | T-10, T-12, T-14, T-20, T-22, T-25, T-26, T-31 |
| FR-02 — Consultar clima atual | T-11, T-13, T-15, T-21, T-23, T-28, T-31 |
| FR-03 — Consultar previsão de cinco dias | T-08, T-11, T-13, T-15, T-21, T-23, T-29, T-56 |
| FR-04 — Alternar unidade de temperatura | T-06, T-24, T-28, T-29, T-30, T-56 |
| FR-05 — Tratar carregamento, falhas e timeout | T-09, T-14, T-15, T-20, T-21, T-22, T-23, T-27, T-31 |

**Lacunas:** nenhuma. FR-01 a FR-05 têm tarefas implementadoras; os testes correspondentes estão listados separadamente nas entregas de testes e na matriz abaixo.

## Rastreabilidade por tarefa

| Tarefa | Requisito(s) da spec ou referência técnica |
| --- | --- |
| T-01 | Plano técnico — stack e inclusão do Fastify; NFR-07 (mediação no backend). |
| T-02 | Plano técnico — compilação isolada de frontend e backend. |
| T-03 | Plano técnico — execução e build do backend. |
| T-04 | NFR-07 — chamadas ao provedor mediadas pelo backend. |
| T-05 | FR-01–FR-05; AC-02.4; AC-03.3; AC-05.2; AC-05.5. |
| T-06 | FR-04; AC-04.2. |
| T-07 | FR-02; FR-03; AC-02.1; AC-02.5; AC-03.2. |
| T-08 | FR-03; AC-03.1; NFR-06. |
| T-09 | FR-05; AC-05.5; NFR-03; NFR-07. |
| T-10 | FR-01; AC-01.5; NFR-07. |
| T-11 | FR-02; FR-03; AC-02.1; AC-02.6; AC-03.1; NFR-07. |
| T-12 | FR-01; AC-01.1–AC-01.3. |
| T-13 | FR-02; FR-03; AC-02.4; AC-03.1–AC-03.4. |
| T-14 | FR-01; AC-01.3–AC-01.5; FR-05; AC-05.2. |
| T-15 | FR-02; FR-03; FR-05; AC-02.4; AC-03.3; AC-05.2; AC-05.5. |
| T-16 | Plano técnico — composição testável da aplicação; NFR-07. |
| T-17 | Plano técnico — execução do backend; NFR-07. |
| T-18 | FR-01; AC-01.1; AC-01.3; AC-01.5; FR-05; AC-05.2. |
| T-19 | FR-02; FR-03; AC-02.4; AC-03.3; FR-05; AC-05.5. |
| T-20 | FR-01; AC-01.5; FR-05; AC-05.2. |
| T-21 | FR-02; FR-03; AC-02.3; AC-02.4; AC-03.3. |
| T-22 | FR-01; AC-01.3–AC-01.5; FR-05; AC-05.1; AC-05.2. |
| T-23 | FR-02; FR-03; FR-05; AC-02.3; AC-05.3–AC-05.6. |
| T-24 | FR-04; AC-04.1; AC-04.4; NFR-07. |
| T-25 | FR-01; AC-01.4; NFR-02. |
| T-26 | FR-01; AC-01.1; AC-01.2; NFR-02. |
| T-27 | FR-05; AC-05.1; AC-05.2; AC-05.5; NFR-02. |
| T-28 | FR-02; AC-02.1–AC-02.6; NFR-06. |
| T-29 | FR-03; AC-03.1–AC-03.4; NFR-06. |
| T-30 | FR-04; AC-04.2; AC-04.3; NFR-02. |
| T-31 | FR-01; FR-02; AC-01.2; AC-02.3; AC-05.1–AC-05.6. |
| T-32 | Plano técnico — inicialização React sem módulos Node no browser. |
| T-33 | FR-04; AC-04.2. |
| T-34 | FR-02; AC-02.5; FR-03; AC-03.1; NFR-06. |
| T-35 | FR-01; AC-01.5; FR-05; AC-05.2. |
| T-36 | FR-02; AC-02.4; FR-03; AC-03.3. |
| T-37 | FR-01; AC-01.3–AC-01.5; FR-05; AC-05.1–AC-05.3. |
| T-38 | FR-02; AC-02.3; FR-05; AC-05.3–AC-05.6. |
| T-39 | FR-04; AC-04.1; AC-04.4; NFR-07. |
| T-40 | FR-01; AC-01.1; AC-01.2; AC-01.4; NFR-02. |
| T-41 | FR-05; AC-05.1; AC-05.2; AC-05.5; NFR-02. |
| T-42 | FR-02; AC-02.1–AC-02.6. |
| T-43 | FR-03; AC-03.1–AC-03.4; FR-04; AC-04.2. |
| T-44 | FR-04; AC-04.2; AC-04.3; NFR-02. |
| T-45 | FR-01; AC-01.2; FR-05; AC-05.6. |
| T-46 | FR-01; AC-01.1; FR-02; AC-02.1. |
| T-47 | FR-04; AC-04.1–AC-04.4; NFR-07. |
| T-48 | FR-01; AC-01.3; AC-01.4; FR-05; AC-05.2. |
| T-49 | FR-05; AC-05.2; AC-05.3; AC-05.5. |
| T-50 | FR-05; AC-05.4; AC-05.6. |
| T-51 | NFR-01. |
| T-52 | NFR-01; NFR-02. |
| T-53 | NFR-08. |
| T-54 | Pergunta em aberto 1 e riscos do provedor; NFR-07. |
| T-55 | Plano técnico — estratégia de testes e gates de entrega. |
| T-56 | FR-03; FR-04; AC-03.1–AC-03.4; AC-04.2–AC-04.4. |