# Especificação de Produto: Weather App

**Status:** especificação detalhada para revisão de produto e técnica. Não aprovar como baseline de produção antes de resolver as perguntas em aberto e aprovar as metas marcadas como propostas.

## Overview

O Weather App é uma aplicação web para consultar o clima atual e a previsão diária de cidades. A experiência deve permitir localizar e selecionar uma cidade, consultar as condições meteorológicas de hoje e dos quatro dias seguintes e alternar a unidade de temperatura entre Celsius e Fahrenheit.

O mercado prioritário é o Brasil e o idioma da interface é pt-BR. O produto usará Open-Meteo sem API key; a prévia pode consultar diretamente o geocoding e o forecast. Não haverá autenticação nem persistência de dados de usuário no servidor; a preferência de unidade poderá ser persistida somente no navegador.

A experiência será oferecida em navegador, com suporte prioritário a dispositivos móveis e às versões estáveis mais recentes dos navegadores definidos em NFR-08. As datas da previsão seguem o fuso local da cidade selecionada. Personas são hipóteses; as metas de tempo de conclusão das tarefas foram validadas.

**Escopo proposto para a primeira versão:** busca manual de cidades, clima atual, previsão diária de cinco datas, troca de unidade e estados de carregamento, vazio e erro. Não se presume localização automática, favoritos ou alertas meteorológicos.

## Functional Requirements

- **FR-01 — Buscar e selecionar uma cidade:** permitir que a pessoa pesquise pelo nome da cidade usando Open-Meteo Geocoding e escolha explicitamente um resultado. Para localidades no Brasil, cada sugestão deve exibir nome da cidade, estado e país quando fornecidos pelo serviço, permitindo desambiguar resultados.
- **FR-02 — Consultar clima atual:** para a cidade selecionada, apresentar temperatura atual, condição meteorológica em pt-BR, data/hora de referência quando fornecida e métricas de umidade relativa (%), velocidade do vento (km/h), precipitação (mm) e pressão à superfície (hPa). A unidade inicial da temperatura é Celsius; as unidades das métricas não mudam com o seletor de temperatura.
- **FR-03 — Consultar previsão de cinco dias:** apresentar uma previsão diária para hoje e os quatro dias seguintes no fuso local da cidade. Cada dia deve exibir data, condição meteorológica em pt-BR, temperaturas mínima e máxima e probabilidade máxima diária de precipitação em %.
- **FR-04 — Alternar unidade de temperatura:** permitir alternar entre Celsius e Fahrenheit e atualizar todas as temperaturas exibidas. A unidade inicial é Celsius; a preferência selecionada deve ser persistida no navegador, sem armazenamento no servidor.
- **FR-05 — Tratar carregamento, falhas e timeout:** apresentar estados de carregamento e informar falhas de geocoding ou de consulta meteorológica. Diferenciar falha do serviço de uma busca bem-sucedida sem resultados, oferecer nova tentativa após falha ou timeout e não apresentar respostas obsoletas como atuais.

## User Stories

- **US-01:** Como Camila, pessoa que se desloca diariamente, quero pesquisar e selecionar minha cidade para consultar as condições do local onde vou sair. **Requisito relacionado:** FR-01.
- **US-02:** Como Camila, pessoa que se desloca diariamente, quero ver o clima atual da cidade selecionada para decidir como me preparar para o trajeto. **Requisito relacionado:** FR-02.
- **US-03:** Como André, planejador de viagem curta, quero consultar a previsão diária do destino para hoje e os quatro dias seguintes para organizar meus planos. **Requisito relacionado:** FR-03.
- **US-04:** Como André, planejador de viagem curta, quero alternar entre Celsius e Fahrenheit para interpretar as temperaturas na unidade que prefiro. **Requisito relacionado:** FR-04.
- **US-05:** Como Renata, profissional que trabalha ao ar livre, quero ser informada quando uma consulta falhar e poder tentar novamente para não confundir dados antigos com condições atuais. **Requisito relacionado:** FR-05.

## Matriz de Rastreabilidade

| User Story | Requisito funcional | Acceptance Criteria | NFRs relevantes |
|---|---|---|---|
| US-01 — Buscar e selecionar a cidade para planejar o deslocamento. | FR-01 | AC-01.1–AC-01.5 | NFR-01 responsividade; NFR-02 acessibilidade; NFR-03 performance; NFR-06 pt-BR; NFR-07 privacidade; NFR-08 compatibilidade. |
| US-02 — Consultar o clima atual antes de sair. | FR-02 | AC-02.1–AC-02.6 | NFR-01 responsividade; NFR-02 acessibilidade; NFR-03 performance; NFR-04 disponibilidade; NFR-05 atualidade; NFR-06 pt-BR; NFR-08 compatibilidade. |
| US-03 — Consultar cinco dias no destino. | FR-03 | AC-03.1–AC-03.4 | NFR-01 responsividade; NFR-02 acessibilidade; NFR-03 performance; NFR-04 disponibilidade; NFR-05 atualidade; NFR-06 pt-BR e fuso local; NFR-08 compatibilidade. |
| US-04 — Alternar a unidade de temperatura. | FR-04 | AC-04.1–AC-04.4 | NFR-01 responsividade; NFR-02 acessibilidade; NFR-03 resposta da interface; NFR-06 formatos; NFR-07 persistência somente no navegador; NFR-08 compatibilidade. |
| US-05 — Receber e recuperar-se de falhas de consulta. | FR-05 | AC-05.1–AC-05.6 | NFR-02 acessibilidade; NFR-03 timeout e performance; NFR-04 disponibilidade; NFR-05 dados atuais; NFR-07 privacidade; NFR-08 compatibilidade. |

## Métricas de Sucesso

- **Camila:** encontrar a cidade e visualizar o clima atual em até 30 segundos, medidos do início da busca até a exibição dos dados.
- **André:** localizar o destino e revisar as cinco datas da previsão em até 2 minutos, medidos do início da busca até a exibição completa.
- **Renata:** consultar a previsão da cidade de trabalho e identificar a referência de atualização disponível em até 30 segundos.

## Métricas de Sucesso

- **Camila:** encontrar a cidade e visualizar o clima atual em até 30 segundos, medidos do início da busca até a exibição dos dados.
- **André:** localizar o destino e revisar as cinco datas da previsão em até 2 minutos, medidos do início da busca até a exibição completa.
- **Renata:** consultar a previsão da cidade de trabalho e identificar a referência de atualização disponível em até 30 segundos.

## Acceptance Criteria

Cada cenário usa Given/When/Then e pode ser executado com respostas controladas da API.

### FR-01 — Buscar e selecionar uma cidade

- **AC-01.1:** **Given** o geocoding retorna um ou mais resultados para uma cidade brasileira, **When** a pessoa envia o nome da cidade, **Then** cada resultado é selecionável e mostra nome da cidade, estado e país quando fornecidos pelo serviço.
- **AC-01.2:** **Given** os resultados incluem localidades com o mesmo nome, **When** a lista é exibida, **Then** cada opção mostra os atributos de localização disponíveis, incluindo estado e país quando fornecidos, e nenhuma localidade fica selecionada automaticamente.
- **AC-01.3:** **Given** uma consulta não vazia é processada com sucesso e o geocoding retorna zero resultados, **When** a busca termina, **Then** a interface exibe “Cidade não encontrada.”, mantém a consulta editável e não inicia uma consulta meteorológica.
- **AC-01.4:** **Given** o campo contém apenas espaços em branco, **When** a pessoa envia a busca, **Then** a interface exibe “Informe uma cidade.” e nenhuma requisição de geocoding é enviada.
- **AC-01.5:** **Given** o campo contém ` São Tomé-d'Ávila `, **When** a pessoa envia a busca, **Then** a query decodificada enviada ao geocoding é `São Tomé-d'Ávila`, preservando acentos, hífen e apóstrofo e removendo os espaços externos.

### FR-02 — Consultar clima atual

- **AC-02.1:** **Given** a unidade selecionada é Celsius e a resposta contém temperatura de 18 °C, código meteorológico WMO 0 e horário de referência, **When** a resposta é apresentada, **Then** a interface identifica a cidade selecionada e exibe 18 °C, o rótulo “Céu limpo” em pt-BR e o horário retornado.
- **AC-02.2:** **Given** uma resposta de clima atual sem horário de referência, **When** os dados são apresentados, **Then** a interface não inventa um horário de observação.
- **AC-02.3:** **Given** a pessoa seleciona uma cidade, **When** a resposta correspondente é apresentada, **Then** a interface não associa os valores recebidos a outra cidade.
- **AC-02.4:** **Given** a resposta de clima atual não contém um ou mais campos meteorológicos, **When** os dados são apresentados, **Then** os campos disponíveis são exibidos e cada campo ausente mostra “Indisponível”, sem substituí-lo por zero ou por um valor inventado.
- **AC-02.5:** **Given** a resposta contém um código meteorológico sem mapeamento pt-BR, **When** a condição atual é apresentada, **Then** a interface exibe “Condição indisponível” e não mostra o código bruto.
- **AC-02.6:** **Given** as métricas atuais estão disponíveis, **When** o clima é apresentado, **Then** umidade, velocidade do vento, precipitação e pressão à superfície são exibidas respectivamente em %, km/h, mm e hPa; cada valor ausente mostra “Indisponível”, inclusive sem confundir zero com ausência.

### FR-03 — Consultar previsão de cinco dias

- **AC-03.1:** **Given** uma cidade selecionada e dados para cinco datas, **When** a previsão é apresentada, **Then** ela contém exatamente cinco datas consecutivas no fuso local da cidade: hoje e os quatro dias seguintes.
- **AC-03.2:** **Given** cada data diária da resposta contém código meteorológico, mínima e máxima, **When** a previsão é apresentada, **Then** cada uma das cinco datas mostra a condição com rótulo em pt-BR, além das mínimas e máximas associadas à data correta.
- **AC-03.3:** **Given** a resposta da fonte não contém dados para todas as cinco datas ou omite campos de uma data, **When** a previsão é apresentada, **Then** a interface mantém as cinco posições de data, mostra “Indisponível” nas datas ou campos sem dados, exibe “Previsão incompleta” e não inventa valores nem afirma que a previsão está completa.
- **AC-03.4:** **Given** a probabilidade máxima diária de precipitação está disponível, **When** a previsão é apresentada, **Then** o dia mostra o percentual identificado como máximo; zero é exibido como 0% e um valor ausente como “Indisponível”.

### FR-04 — Alternar unidade de temperatura

- **AC-04.1:** **Given** não existe preferência de unidade armazenada no navegador, **When** o clima é apresentado, **Then** todas as temperaturas aparecem em Celsius.
- **AC-04.2:** **Given** valores de 20 °C e 10 °C estão visíveis, **When** a pessoa seleciona Fahrenheit, **Then** esses valores aparecem como 68 °F e 50 °F, e todas as demais temperaturas visíveis também são convertidas usando °F = °C × 9/5 + 32 e arredondadas ao inteiro mais próximo, com empates arredondados para longe de zero.
- **AC-04.3:** **Given** a unidade está em Fahrenheit, **When** a pessoa retorna para Celsius, **Then** os valores voltam à unidade Celsius sem alterar a cidade ou as datas da previsão.
- **AC-04.4:** **Given** a pessoa seleciona Fahrenheit, **When** recarrega a página no mesmo navegador, **Then** a preferência armazenada no navegador é restaurada e não é enviada nem salva no servidor.

### FR-05 — Tratar carregamento, falhas e timeout

- **AC-05.1:** **Given** uma busca ou consulta meteorológica foi iniciada e ainda não terminou, **When** a interface aguarda a resposta, **Then** um indicador com role `status` e o texto “Carregando...” é apresentado.
- **AC-05.2:** **Given** uma busca ou consulta meteorológica falha por rede ou resposta de erro do serviço, **When** a falha é recebida, **Then** a interface exibe “Não foi possível concluir a consulta.” e um botão “Tentar novamente”; não exibe a mensagem “Cidade não encontrada.” para uma falha do serviço.
- **AC-05.3:** **Given** a mensagem de falha e o botão “Tentar novamente” estão visíveis, **When** a pessoa aciona o botão e a fonte responde com sucesso, **Then** a interface apresenta os dados da nova resposta e remove a mensagem de falha.
- **AC-05.4:** **Given** havia dados de uma cidade anteriormente selecionada, **When** a consulta de uma cidade diferente falha, **Then** os valores anteriores não são apresentados como clima atual da nova cidade.
- **AC-05.5:** **Given** uma requisição continua sem resposta, **When** o limite provisório de timeout de 8 segundos é atingido, **Then** a requisição é encerrada, o carregamento termina, a interface exibe “A consulta excedeu o tempo limite.” e oferece o botão “Tentar novamente”.
- **AC-05.6:** **Given** uma consulta da cidade A ainda está em andamento e a pessoa seleciona a cidade B, **When** a resposta de A chega depois da seleção de B, **Then** os dados de A não substituem nem são apresentados como dados atuais de B.

## Non-Functional Requirements

As metas marcadas como propostas devem ser confirmadas antes da aprovação da baseline.

- **NFR-01 — Responsividade:** as principais tarefas devem funcionar em larguras de viewport a partir de 320 px, sem rolagem horizontal da página, conteúdo sobreposto ou perda dos controles de busca e consulta.
- **NFR-02 — Acessibilidade:** atender ao WCAG 2.2 nível AA. Busca, seleção, alternância de unidade e nova tentativa devem ser operáveis por teclado; controles, mensagens de erro e estados de carregamento devem ter nomes e anúncios acessíveis.
- **NFR-03 — Performance:** interações locais da interface devem responder em até 200 ms. A meta proposta para busca e consulta é exibir resultado ou erro em até 3 s no percentil 95, medidos do envio da ação até a renderização. A rede e o dispositivo de teste ainda precisam ser definidos. O timeout por requisição de 8 s está aprovado.
- **NFR-04 — Disponibilidade:** meta aprovada de 99,5% por mês, medida por verificações sintéticas do fluxo principal do ponto de vista do usuário e incluindo falhas do Open-Meteo.
- **NFR-05 — Atualidade e procedência:** exibir a data/hora de referência fornecida pela fonte quando disponível. O produto não deve afirmar que dados desatualizados são atuais; o limite de idade para marcar dados como desatualizados precisa ser definido.
- **NFR-06 — Idioma e formatos:** textos da interface e descrições meteorológicas devem estar em pt-BR. Datas e horários da previsão devem usar o fuso local da cidade; datas e números devem seguir formatos brasileiros.
- **NFR-07 — Privacidade:** não exigir conta nem persistir dados de usuário ou histórico de consulta no servidor. A preferência de unidade pode ser armazenada somente no navegador. Na prévia, consultas diretas expõem o endereço IP e a cidade ou coordenadas ao provedor; o produto planejado deve mediar as consultas pelo backend.
- **NFR-08 — Compatibilidade:** suportar as versões estáveis mais recentes disponíveis no lançamento de Chrome, Firefox e Edge em desktop; Safari em macOS e iOS; e Chrome em Android. A matriz de teste deve registrar navegador, versão, sistema operacional e data da validação.

## Edge Cases

| Caso | Comportamento esperado |
|---|---|
| Cidade inexistente | O geocoding retorna zero resultados; apresentar o estado “cidade não encontrada”, manter a consulta editável e não buscar dados meteorológicos. |
| Input vazio ou só com espaços | Não enviar requisição de geocoding; solicitar o nome da cidade e manter o campo disponível para correção. |
| Acentos e caracteres especiais | Remover espaços externos, preservar acentos, hífens e apóstrofos válidos e enviar o parâmetro de busca corretamente codificado. |
| Geocoding sem resultados | Tratar como resposta bem-sucedida sem correspondências, distinta de erro de rede ou do serviço; permitir nova busca e não iniciar consulta meteorológica. |
| Falha de API | Informar que a operação falhou, disponibilizar nova tentativa e não apresentar dados anteriores como atuais. |
| Timeout | Após o limite provisório de 8 s, encerrar a requisição, limpar o carregamento, informar o timeout e permitir nova tentativa. |
| Resposta parcial | Manter as cinco posições de data; exibir campos disponíveis, marcar ausências como “Indisponível” e a previsão como “Previsão incompleta”; não preencher dados desconhecidos com zero ou valores inferidos. |
| Localidades homônimas | Mostrar região e país quando disponíveis, exigir escolha explícita e não selecionar uma cidade silenciosamente. |
| Troca de cidade durante consulta | Exibir como atuais apenas dados correspondentes à seleção mais recente; descartar ou ignorar respostas obsoletas. |
| Virada de data entre cidade e dispositivo | Calcular as datas da previsão pelo fuso local da cidade selecionada, sujeito à confirmação da regra de fuso. |
| Virada de data entre cidade e dispositivo | Calcular as datas da previsão pelo fuso local da cidade selecionada, independentemente do fuso configurado no dispositivo. |
| Limite temporário de requisições | Informar indisponibilidade temporária, oferecer nova tentativa e não confundir o caso com busca sem resultados. |
| Temperaturas negativas ou conversão de unidade | Converter valores negativos pela mesma fórmula das demais temperaturas e aplicar o arredondamento especificado para Fahrenheit. |

## Assumptions

- O produto da primeira versão é uma aplicação web acessada por navegador, com suporte a desktop e dispositivos móveis; não é um aplicativo nativo.
- A busca é manual por nome de cidade. A aplicação não solicita localização do dispositivo.
- O clima atual inclui temperatura, condição, horário de referência quando disponível e as quatro métricas de FR-02; a previsão diária exibe condição, mínima, máxima e probabilidade máxima diária de precipitação. Sensação térmica permanece fora do MVP. Códigos meteorológicos são mapeados para rótulos pt-BR; códigos sem mapeamento usam “Condição indisponível”.
- As cinco datas são calculadas no fuso local da cidade selecionada.
- Celsius é a unidade inicial. A preferência entre Celsius e Fahrenheit persiste no navegador, sem ser enviada ou armazenada no servidor.
- A conversão para Fahrenheit é arredondada ao inteiro mais próximo, com empates para longe de zero; regra aprovada pelo produto.
- A fonte meteorológica e de geocodificação é Open-Meteo, sem API key. A prévia pode consultar ambos diretamente, expondo o endereço IP e a cidade ou coordenadas ao provedor; o produto planejado usará o backend. Não há persistência de dados de usuário no servidor.
- O Brasil é o mercado prioritário; a busca usa o nome digitado e apresenta sugestões com estado e país quando disponíveis.
- A unidade padrão é Celsius; a interface e as condições meteorológicas são apresentadas em pt-BR.
- As metas de conclusão de tarefa das personas foram validadas: até 30 segundos para Camila e Renata e até 2 minutos para André. As personas continuam sendo perfis de referência.
- O timeout de requisição é de 8 segundos; falhas e desconexão são tratadas com mensagem e nova tentativa manual, sem apresentar dados antigos como atuais.
- O suporte de navegador cobre as versões estáveis mais recentes de Chrome, Safari, Firefox e Edge no lançamento.

## Risks

- **Dependência do Open-Meteo:** limites, termos, cobertura ou indisponibilidade podem afetar a experiência; confirmar as condições aplicáveis e definir comportamento de falha antes da entrega.
- **Atualidade dos dados:** idade máxima para considerar uma observação atual ainda não foi definida; uma decisão tardia pode exigir alterações na apresentação e no cache.
- **Ambiguidade geográfica:** cidades homônimas ou cobertura regional insuficiente podem levar à previsão do local incorreto; validar resultados e exigir seleção explícita.
- **Desempenho em rede móvel:** a dependência de rede pode exceder as metas propostas; validar em dispositivos e redes representativos e acordar timeout e indicadores de carregamento.
- **Privacidade e arquitetura:** ausência de persistência no servidor pode ser confundida com ausência de backend ou de armazenamento local; definir a fronteira de integração e retenção antes do plano técnico.
- **Expectativa de alertas:** o usuário pode interpretar o app como fonte de alertas de emergência; declarar claramente se alertas estão fora do produto e não sugerir substituição de fontes oficiais.
- **Escopo baseado em personas não validadas:** priorizar funcionalidades por perfis hipotéticos pode gerar baixo valor; validar público, métricas e escopo do MVP com stakeholders ou usuários.
- **Personas hipotéticas:** os perfis de Camila, André e Renata não representam segmentos de usuários validados; não ampliar o escopo com base apenas nesses perfis.

## Out of Scope

Itens confirmados fora do MVP:

- Autenticação, contas de usuário e dados persistidos no servidor.
- Aplicativo nativo para iOS ou Android.
- Geolocalização automática do dispositivo.
- Favoritos, histórico de buscas ou sincronização entre dispositivos.
- Alertas de tempo severo ou notificações push; o app não substitui alertas oficiais.
- Previsão horária, dados históricos, mapas meteorológicos e comparação entre várias cidades na mesma tela.
- Idiomas diferentes de pt-BR.
- Unidades além de Celsius e Fahrenheit para temperatura.

## Open Questions

1. Quais termos de uso, limites, requisitos de atribuição, cobertura e garantias de disponibilidade do Open-Meteo se aplicam a este produto?
2. Qual idade máxima de uma observação permite apresentá-la como atual? Qual horário deve ser mostrado se a fonte fornecer tempo de modelo em vez de tempo de observação?
3. Qual dispositivo e perfil de rede devem ser usados para validar a meta proposta de resultado ou erro em até 3 s no percentil 95?
