# Plano Técnico: Weather App

## Architecture

- **Frontend:** aplicação web React/Vite para busca, seleção de cidade, exibição do clima e preferência de unidade.
- **Camadas do frontend:** `components` apresenta a interface; `hooks` orquestra estado e casos de uso; `services` faz I/O com a API interna; `lib` contém funções puras de conversão, mapeamento e formatação.
- **Direção de dependência:** components → hooks → services; hooks/components podem usar funções de `lib`. `services` e `lib` não importam React nem componentes. Contratos compartilhados vêm de `shared/`.
- **Backend:** serviço Node.js/TypeScript no mesmo repositório, mediando as chamadas de produção a Open-Meteo. Excepcionalmente, o serviço de prévia `src/services/weatherService.ts` consulta geocoding e forecast diretamente do navegador, expondo IP e cidade ou coordenadas ao provedor; a integração definitiva deve usar os endpoints internos.
- **Persistência:** sem banco ou estado de usuário no servidor. Armazenar somente a unidade escolhida no `localStorage` do navegador.
- **Integração:** dois endpoints internos, um para geocoding e outro para clima. Normalizar respostas externas em contratos próprios, sem expor payload bruto da Open-Meteo.
- **Cache:** não implementar na primeira versão, pois a idade máxima aceitável dos dados ainda está em aberto.
- **Implantação:** servir frontend e API no mesmo domínio, com encaminhamento de `/api` ao backend para simplificar CORS e configuração do cliente.

## Tech Stack

- React 19, TypeScript, Vite e Tailwind CSS no frontend, conforme a stack atual.
- Node.js 22+ e Fastify no backend. Fastify mantém as rotas pequenas e permite testes de integração por `app.inject`.
- `fetch` nativo do Node para chamadas externas, com timeout de 8 segundos conforme a spec.
- Vitest e Testing Library para testes unitários/de componentes; Playwright para E2E.
- Não adicionar banco, ORM, autenticação, cache, cliente HTTP ou biblioteca global de estado.
- Fastify é a única nova dependência de runtime proposta; o backend ainda precisa ser incluído na configuração de build e execução do workspace.

## Project Structure

```text
shared/
  weather-contracts.ts          # Contratos compartilhados entre cliente e backend

server/
  app.ts                        # Criação do Fastify e registro das rotas
  index.ts                      # Inicialização do servidor
  routes/
    locations.ts                # GET /api/locations
    weather.ts                  # GET /api/weather
  services/
    openMeteoClient.ts          # HTTP, timeout e erros do provedor
    weatherMapper.ts            # Normalização e validação das respostas externas

src/
  main.tsx                      # Inicialização React
  App.tsx                       # Composição da tela principal
  components/
    CitySearch.tsx              # Campo e envio da busca
    CitySuggestions.tsx         # Sugestões e seleção explícita
    CurrentWeather.tsx          # Apresentação das condições atuais
    ForecastList.tsx            # Lista responsiva dos cinco dias
    ForecastCard.tsx            # Apresentação de um dia
    UnitSelector.tsx            # Controle Celsius/Fahrenheit
    QueryStatus.tsx             # Loading, vazio e erro acessíveis
  hooks/
    useCitySearch.ts            # Estado e fluxo da busca de cidades
    useWeather.ts               # Seleção da cidade e ciclo da consulta
    useUnitPreference.ts        # Unidade e persistência local no navegador
  services/
    weatherApi.ts               # Fetch, serialização de query e erros da API interna
  lib/
    temperature.ts              # Conversão e arredondamento C/F, sem I/O
    weatherCodes.ts             # Mapeamento de códigos WMO para pt-BR
    dateTime.ts                 # Datas/horários usando o fuso recebido
    format.ts                   # Formatação de datas locais da previsão

tests/
  unit/                         # Conversões, mapeadores e validações puras
  integration/                  # Rotas do backend com provedor simulado
  e2e/                          # Fluxos críticos com Playwright
```

`components` recebe dados e callbacks e não chama endpoints diretamente. `hooks` coordena estados `idle/loading/success/empty/error`, retry manual e proteção contra respostas obsoletas. `services` é a única camada do browser que conhece `/api` e trata transporte/erros HTTP. `lib` não tem efeitos colaterais, React ou acesso à rede, o que mantém conversões, mapeamentos e formatação determinísticos. A configuração do workspace deve compilar frontend e backend sem incluir módulos Node no bundle do navegador. Em desenvolvimento, Vite encaminha `/api` para Fastify; em produção, o backend ou o proxy de implantação serve os assets e roteia `/api`.

Para datas diárias `AAAA-MM-DD`, `getDayLabel(date, index)` retorna “Hoje” no índice 0, “Amanhã” no índice 1 e o dia da semana em pt-BR nos demais; `getShortDate(date)` retorna `DD/MM`. Ambas retornam `null` para datas inválidas e preservam a data local sem deslocamento pelo fuso do processo. A apresentação atual dos cartões continua usando `formatForecastDate`.

## Data Model

Os contratos abaixo descrevem fronteiras e dados normalizados; não são código final de implementação. Todas as temperaturas trafegam em Celsius. Campos ausentes na resposta externa são representados por `null`, nunca por zero.

```ts
export type Unit = "celsius" | "fahrenheit";

export interface City {
  id: number | null; // ID de geocoding, quando fornecido
  name: string; // Nome da cidade
  admin1: string | null; // Estado ou região administrativa
  country: string | null; // País
  countryCode: string | null; // Código do país
  latitude: number; // Coordenada usada na consulta meteorológica
  longitude: number; // Coordenada usada na consulta meteorológica
}

export interface CurrentWeather {
  temperatureC: number | null; // Temperatura atual em Celsius
  weatherCode: number | null; // Código WMO da condição atual
  time: string | null; // Horário retornado pelo provedor no fuso da cidade
  humidityPercent: number | null; // Umidade relativa em %
  windSpeedKmh: number | null; // Velocidade do vento em km/h
  precipitationMm: number | null; // Precipitação do intervalo atual em mm
  surfacePressureHpa: number | null; // Pressão à superfície em hPa
}

export interface ForecastDay {
  date: string; // Data local YYYY-MM-DD
  weatherCode: number | null; // Código WMO da condição diária
  minimumC: number | null; // Mínima diária em Celsius
  maximumC: number | null; // Máxima diária em Celsius
  precipitationProbabilityMaxPercent: number | null; // Probabilidade máxima diária em %
}

export interface WeatherData {
  city: City; // Cidade selecionada no cliente
  timezone: string; // Fuso IANA retornado pelo provedor
  fetchedAt: string; // Instante UTC em que o backend recebeu a resposta
  current: CurrentWeather; // Condições atuais normalizadas
  forecast: ForecastDay[]; // Exatamente cinco datas locais
  isPartial: boolean; // Indica campos ou datas meteorológicas ausentes
}

export type ApiErrorCode =
  | "INVALID_QUERY"
  | "UPSTREAM_TIMEOUT"
  | "UPSTREAM_UNAVAILABLE"
  | "UPSTREAM_INVALID_RESPONSE";

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode; // Código estável para tratamento no cliente
    message: string; // Mensagem segura, sem detalhes internos do provedor
    retryable: boolean; // Indica se nova tentativa manual faz sentido
  };
}
```

`WeatherData.city` vem da sugestão selecionada no cliente; `GET /api/weather` recebe as coordenadas e retorna os campos meteorológicos. `time` é o horário fornecido para as condições atuais, enquanto `fetchedAt` registra apenas quando o backend recebeu os dados. O cliente mapeia códigos WMO para rótulos pt-BR e usa “Condição indisponível” para códigos sem mapeamento.

## Data Flow

1. O usuário digita o nome da cidade. O cliente remove espaços externos; se a entrada ficar vazia, mostra “Informe uma cidade.” e não envia requisição.
2. O cliente chama `GET /api/locations?query={name}`.
3. O backend valida a query, chama Open-Meteo Geocoding em português e retorna sugestões normalizadas. Zero resultados é uma resposta bem-sucedida com lista vazia.
4. O usuário escolhe explicitamente uma sugestão; nenhuma localidade é selecionada automaticamente.
5. O cliente chama `GET /api/weather?latitude={lat}&longitude={lon}`.
6. O backend chama Open-Meteo Forecast em Celsius, com fuso automático e cinco dias, e converte a resposta para o contrato interno.
7. O cliente associa a resposta à cidade selecionada, formata datas no fuso local retornado e apresenta estado completo ou parcial.
8. Ao trocar de cidade, o cliente invalida ou aborta a consulta anterior e ignora respostas obsoletas.
9. Ao alternar unidade, o cliente converte todos os valores visíveis e persiste apenas a preferência no navegador.

```mermaid
flowchart TD
  Input[Input de busca] --> Validate{Entrada vazia?}
  Validate -- Sim --> EmptyInput[UI: "Informe uma cidade"]
  Validate -- Não --> GeoService[Service de geocoding<br/>GET /api/locations]

  GeoService --> GeoResult{Resultado do geocoding}
  GeoResult -- Sugestões --> Suggestions[Componentes: lista de cidades]
  GeoResult -- Sem resultados --> SearchEmpty[Hook de busca: empty]
  SearchEmpty --> EmptyCityUI[UI: "Cidade não encontrada"]
  GeoResult -- Erro de rede ou API --> SearchError[Hook de busca: error]
  SearchError --> SearchErrorUI[UI: erro e tentar novamente]

  Suggestions --> Select[Seleção explícita da cidade]
  Select --> ForecastService[Service de forecast<br/>GET /api/weather]
  ForecastService --> ForecastResult{Resposta do forecast}
  ForecastResult -- Completa ou parcial --> WeatherSuccess[Hook de clima: success]
  WeatherSuccess --> WeatherUI[Componentes: clima atual e previsão]
  ForecastResult -- Rede, API ou timeout --> WeatherError[Hook de clima: error]
  WeatherError --> WeatherErrorUI[UI: erro e tentar novamente]
```

## External APIs

### Geocoding API

- **URL:** `https://geocoding-api.open-meteo.com/v1/search`
- **Parâmetros:** `name` (obrigatório; nome digitado), `count=10` (limite de sugestões), `language=pt` (rótulos da busca em português) e `format=json`.
- **Exemplo de requisição:** `GET https://geocoding-api.open-meteo.com/v1/search?name=S%C3%A3o+Paulo&count=10&language=pt&format=json`
- **Resposta resumida:**

```json
{
  "results": [
    {
      "id": 3448439,
      "name": "São Paulo",
      "latitude": -23.55,
      "longitude": -46.63,
      "country": "Brasil",
      "country_code": "BR",
      "admin1": "São Paulo"
    }
  ]
}
```

- **Mapeamento para `City`:** `id` → `id`; `name` → `name`; `admin1` → `admin1`; `country` → `country`; `country_code` → `countryCode`; `latitude` → `latitude`; `longitude` → `longitude`. Campos de localização que não vierem na resposta são normalizados para `null`. Zero correspondências, incluindo `results` ausente ou nulo, são normalizadas pelo backend como `results: []`.
- **Prévia direta:** `searchCities` em `src/services/weatherService.ts` aplica o mesmo mapeamento com `fetch` ao geocoding. Campo vazio não aciona rede, HTTP não-2xx e JSON ou dados inválidos geram `WeatherServiceError`. O transporte direto de geocoding e forecast usa timeout de 10 s, incluindo a leitura do corpo, com erros de timeout e rede normalizados; este limite é específico da prévia e não altera o timeout de 8 s planejado para o backend. Este serviço não está conectado à interface e não substitui T-20.

### Forecast API

- **URL:** `https://api.open-meteo.com/v1/forecast`
- **Parâmetros:** `latitude` e `longitude` da cidade selecionada; `current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,precipitation,surface_pressure`; `daily=weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max`; `temperature_unit=celsius`; `wind_speed_unit=kmh`; `precipitation_unit=mm`; `timezone=auto`; `forecast_days=5` (hoje e os quatro dias seguintes no fuso local retornado).
- **Exemplo de requisição:** `GET https://api.open-meteo.com/v1/forecast?latitude=-23.55&longitude=-46.63&current=temperature_2m%2Cweather_code%2Crelative_humidity_2m%2Cwind_speed_10m%2Cprecipitation%2Csurface_pressure&daily=weather_code%2Ctemperature_2m_min%2Ctemperature_2m_max%2Cprecipitation_probability_max&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm&timezone=auto&forecast_days=5`
- **Resposta resumida:**

```json
{
  "timezone": "America/Sao_Paulo",
  "timezone_abbreviation": "GMT-3",
  "utc_offset_seconds": -10800,
  "current_units": {
    "time": "iso8601",
    "temperature_2m": "°C",
    "weather_code": "wmo code",
    "relative_humidity_2m": "%",
    "wind_speed_10m": "km/h",
    "precipitation": "mm",
    "surface_pressure": "hPa"
  },
  "current": {
    "time": "2026-11-11T09:00",
    "temperature_2m": 22.4,
    "weather_code": 1,
    "relative_humidity_2m": 68,
    "wind_speed_10m": 12.5,
    "precipitation": 0,
    "surface_pressure": 1013.2
  },
  "daily_units": {
    "time": "iso8601",
    "weather_code": "wmo code",
    "temperature_2m_min": "°C",
    "temperature_2m_max": "°C",
    "precipitation_probability_max": "%"
  },
  "daily": {
    "time": ["2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15"],
    "weather_code": [1, 2, 3, 1, 0],
    "temperature_2m_min": [17.1, 18.0, 17.4, 16.8, 17.2],
    "temperature_2m_max": [25.0, 26.1, 24.7, 25.3, 26.0],
    "precipitation_probability_max": [30, 45, 80, 20, 0]
  }
}
```

- **Mapeamento para `WeatherData`:** `timezone` → `timezone`; o instante UTC em que o backend recebe a resposta → `fetchedAt`; `current.temperature_2m` → `current.temperatureC`; `current.weather_code` → `current.weatherCode`; `current.time` → `current.time`; `current.relative_humidity_2m` → `current.humidityPercent`; `current.wind_speed_10m` → `current.windSpeedKmh`; `current.precipitation` → `current.precipitationMm`; `current.surface_pressure` → `current.surfacePressureHpa`. Para cada índice `i`, `daily.time[i]` → `forecast[i].date`, `daily.weather_code[i]` → `forecast[i].weatherCode`, `daily.temperature_2m_min[i]` → `forecast[i].minimumC`, `daily.temperature_2m_max[i]` → `forecast[i].maximumC` e `daily.precipitation_probability_max[i]` → `forecast[i].precipitationProbabilityMaxPercent`. A cidade selecionada é anexada pelo cliente em `WeatherData.city`.
- **Entrega incremental:** os componentes e o mock usam o contrato ampliado; a coleta e normalização das métricas atuais e da probabilidade diária na API continuam pendentes de implementação nas tarefas T-11 e T-13.
- **Resposta parcial:** manter cinco posições para as datas locais esperadas; preencher campos ausentes com `null` e definir `isPartial=true`. Não substituir ausências por zero nem criar valores meteorológicos.
- **Prévia direta:** `getWeather` consulta o forecast no navegador. Exige objetos `current` e `daily`, timezone válido e datas diárias válidas; campos ausentes são `null` e datas faltantes são preenchidas a partir da data de recebimento no fuso retornado. `fetchedAt` registra o recebimento no navegador. Esse serviço não está conectado à interface e não substitui T-11, T-13 ou T-21.
- **Segurança de apresentação:** a prévia rejeita temperaturas cuja conversão para Fahrenheit não seja finita; componentes exibem “Indisponível” para valores numéricos não finitos, sem convertê-los em zero. Nome e coordenadas da cidade, timezone e datas diárias são essenciais: sua ausência gera erro, não valores inventados.
- **Semântica temporal:** `current.time` é o horário de referência/modelo devolvido pela API, não uma garantia de observação física. `fetchedAt` é o horário da consulta no backend e não deve ser exibido como horário do clima. A apresentação de `current.time` como referência, e não como observação, deve respeitar a questão em aberto da spec.

### Contratos e operação

- Nenhuma API key é necessária. Fora da exceção de prévia direta, somente o backend acessa os domínios Open-Meteo.
- O módulo `openMeteoClient` é o único que conhece URLs, parâmetros e nomes de campos externos. Rotas internas retornam contratos próprios e nunca repassam corpo bruto.
- Não persistir queries, coordenadas ou respostas; evitar incluir query e coordenadas em logs.
- Termos, limites, atribuição, cobertura e disponibilidade ainda precisam ser confirmados antes do lançamento.

## State Management

Não usar biblioteca global de estado no MVP. O hook da tela principal é dono dos estados de busca, cidade selecionada e consulta do clima; os componentes recebem estado e callbacks por props. Usar estados discriminados para impedir combinações inválidas:

**Exceção de prévia:** `useWeather` usa os serviços diretos e, por solicitação,
consulta automaticamente o clima da primeira cidade encontrada. A interface usa
esse hook. A implementação definitiva continua exigindo
seleção explícita da cidade e mediação pelo backend.

```ts
export type SearchState =
  | { status: "idle" }
  | { status: "loading"; query: string }
  | { status: "success"; items: City[] }
  | { status: "empty"; query: string }
  | { status: "error"; error: ClientError };

export type WeatherState =
  | { status: "idle" }
  | { status: "loading"; city: City }
  | { status: "success"; data: WeatherData }
  | { status: "error"; city: City; error: ClientError };

export type ClientErrorCode = ApiErrorCode | "NETWORK_ERROR" | "INVALID_RESPONSE";

export interface ClientError {
  code: ClientErrorCode;
  message: string;
  retryable: boolean;
}
```

- **Busca:** `idle` antes da consulta; `loading` durante o geocoding; `success` quando há sugestões; `empty` quando uma resposta válida contém zero resultados; `error` somente em falha de transporte ou API.
- **Prévia integrada:** a região de resultado expõe `aria-busy` durante a consulta, com o anúncio de carregamento fora da região ocupada. Busca e seletor de unidade continuam utilizáveis, e a conclusão não desloca automaticamente o foco.
- **Clima:** `idle` enquanto nenhuma cidade foi selecionada; `loading` durante a consulta; `success` para respostas completas ou parciais (`data.isPartial` diferencia os casos); `error` para falhas que impedem obter uma resposta utilizável. Não há estado `empty` para clima: ausência de cidade pertence a `idle`, e ausência de campos numa resposta é sucesso parcial.
- **Unidade:** manter `unit: Unit` separadamente dos dados. Inicializar por `localStorage`; valor ausente ou inválido resulta em `celsius`. Se o armazenamento estiver indisponível, manter a escolha somente em memória.
- **Conversão:** `WeatherData` permanece em Celsius. Na renderização, derivar cada valor com `displayTemperature(valueC, unit)`: para Fahrenheit aplicar `valueC * 9 / 5 + 32` e arredondar ao inteiro mais próximo, com empates para longe de zero. Não gravar valores convertidos no estado e não fazer nova requisição ao alternar unidade.
- **Funções de temperatura:** `convertTemperature` converte de Celsius para a unidade escolhida sem arredondar; `formatTemperature` recebe um valor já convertido, mantém até duas casas decimais em Celsius e arredonda Fahrenheit conforme a regra acima; `unitLabel` retorna o símbolo. Valores nulos permanecem indisponíveis na apresentação.
- **Concorrência:** ao selecionar nova cidade, abortar a chamada anterior quando possível e verificar a identidade da requisição antes de atualizar estado.
- **Cache:** não armazenar clima no browser nesta versão; isso evita reutilizar dados de idade indefinida.

## Error Handling

- **Input vazio:** validação local antes do serviço; mostrar “Informe uma cidade.” e não emitir requisição.
- **Geocoding sem resultados:** resposta válida `200` com `results: []`; transicionar busca para `empty`, mostrar “Cidade não encontrada.” e não chamar o endpoint de clima. Não classificar como erro.
- **Erro de rede browser → backend:** o `fetch` rejeita ou a conexão cai; normalizar localmente como `NETWORK_ERROR`, mostrar mensagem de falha e oferecer nova tentativa manual.
- **Erro HTTP da API interna:** ler `ApiErrorResponse` e preservar `code`/`retryable`. `400 INVALID_QUERY` é erro de entrada; `502 UPSTREAM_INVALID_RESPONSE`, `503 UPSTREAM_UNAVAILABLE` e `504 UPSTREAM_TIMEOUT` são erros do serviço. Mostrar mensagens amigáveis sem payload bruto, stack trace ou detalhes internos.
- **Timeout do provedor:** Fastify aborta a chamada upstream após 8 s e retorna `504 UPSTREAM_TIMEOUT`, `retryable: true`. Não iniciar retries automáticos; o usuário aciona “Tentar novamente”.
- **JSON interno inválido:** se o backend responder com corpo ilegível ou fora do contrato, mapear localmente como `INVALID_RESPONSE` e apresentar falha recuperável, sem tentar renderizar dados parciais malformados.
- **Resposta parcial:** se a resposta puder ser normalizada, manter `WeatherState.success` com `isPartial: true`; campos ausentes permanecem `null`, a interface mostra “Indisponível”/“Previsão incompleta” e não inventa valores. Reservar `error` para respostas inutilizáveis ou indisponibilidade total.
- **Dados anteriores e concorrência:** após falha não rotular dados antigos como atuais; ao trocar de cidade, ignorar respostas da requisição anterior. Não usar cache ou stale-while-revalidate.
- **Acessibilidade:** erros e carregamento devem ser anunciados com roles apropriados e controles operáveis por teclado, conforme NFR-02.

## Testing Strategy

### Vitest

- **`lib` (unitários):** testar conversão Celsius/Fahrenheit, arredondamento incluindo empates e negativos, mapeamento WMO pt-BR, formatação no fuso IANA, normalização de respostas completas/parciais e classificação de erros. São funções puras: sem DOM, rede, relógio real ou mocks.
- **`services` (unitários):** mockar `fetch` e verificar URL, encoding de query, parâmetros, parsing dos contratos, mapeamento dos status HTTP e comportamento diante de JSON inválido, rejeição de rede e timeout.
- **Backend (integração):** usar `app.inject` com cliente upstream simulado para cobrir os dois endpoints, input inválido, zero resultados, timeout, indisponibilidade, limite e resposta parcial. Verificar códigos/status internos, que dados ausentes não viram zero e que detalhes brutos do provedor não vazam.
- **`hooks` (Testing Library):** substituir `services` por mocks controláveis e testar transições `idle → loading → success`, `idle → loading → empty` e `idle → loading → error`, retry manual, estado parcial, preferência da unidade e descarte de resposta obsoleta.
- **`components` (Testing Library):** renderizar estados `loading`, `error`, `empty` e `success`; verificar textos previstos, sugestões selecionáveis, previsões completas/parciais, alternância Celsius/Fahrenheit, roles acessíveis, navegação por teclado e callbacks. Componentes recebem dados e handlers de teste, sem rede real.

### Playwright

- **Fluxo E2E principal:** buscar uma cidade brasileira, selecionar uma sugestão, conferir clima atual e cinco datas, alternar para Fahrenheit, recarregar e verificar que a preferência permanece no navegador.
- **Fluxo de busca vazia:** enviar input em branco e confirmar que nenhuma chamada de geocoding é feita; simular geocoding bem-sucedido sem resultados e verificar a mensagem vazia distinta de erro.
- **Falha e recuperação:** simular erro de rede/HTTP, mostrar retry, acionar retry e confirmar recuperação; simular timeout sem depender do relógio ou da rede externa.
- **Concorrência:** atrasar a resposta da cidade A, selecionar B e confirmar que a resposta atrasada de A não substitui os dados de B.
- **Viewport mobile:** executar o fluxo principal em 320×568 e 390×844; verificar controles utilizáveis, texto sem sobreposição, ausência de rolagem horizontal e acesso por teclado. Manter pelo menos um viewport desktop para o fluxo de planejamento.
- Interceptar apenas a API interna `/api` nos E2E para respostas determinísticas. Validar o cliente do provedor isoladamente nos testes de integração; não depender da disponibilidade da API pública em cada execução.

### Rastreabilidade e execução

- Identificar casos automatizados com os IDs AC-01.1–AC-05.6 e a User Story relacionada.
- Executar `pnpm test` para Vitest e `pnpm test:e2e` para Playwright. Performance p95 só é critério de release depois de fixar dispositivo e perfil de rede.

## Risks & Trade-offs

- **Backend mediador versus chamadas diretas do browser:** o backend centraliza normalização, timeout e privacidade, conforme a spec; em troca, exige hospedagem Node e monitoramento. Chamadas diretas seriam mais simples de implantar, mas violariam a decisão arquitetural do produto e acoplariam a UI ao provedor.
- **React local state versus biblioteca global:** hooks e estado local cobrem o fluxo de uma tela sem dependência adicional; Redux/Zustand só seriam justificáveis com estado compartilhado mais amplo ou múltiplos fluxos persistentes.
- **Celsius canônico versus unidade na API:** buscar sempre em Celsius e converter na renderização evita uma chamada nova ao alternar unidade e mantém um único conjunto de dados. Solicitar novamente em Fahrenheit ou guardar valores duplicados aumentaria requisições e risco de divergência.
- **Sem cache versus cache:** não armazenar respostas é mais simples e evita dados vencidos enquanto o frescor está indefinido; pode aumentar latência e volume de chamadas. Reavaliar somente após confirmar idade máxima, termos e limites do provedor.
- **Mocks E2E versus API pública real:** interceptar `/api` torna E2E rápido e determinístico; mockar também Open-Meteo nesses testes reduz flakiness, enquanto testes de integração validam o mapeamento do provedor. Um smoke test ao vivo pode ser periódico, não bloqueador de cada commit.
- **Viewports simulados versus device farm:** Playwright em viewports móveis cobre layout e interação de forma barata; não substitui validação ocasional em aparelhos reais quando houver acesso.
- **Termos e limites do Open-Meteo pendentes:** podem exigir adaptação de atribuição, integração ou controle de volume; confirmar antes do lançamento.
- **Frescor e perfil de performance pendentes:** idade máxima dos dados e dispositivo/rede de medição ainda precisam de decisão para validar NFR-03/NFR-05.
