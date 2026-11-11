# Discovery: Aplicação de Previsão do Tempo

## Contexto

A empresa solicitou uma aplicação para que usuários consultem informações meteorológicas de cidades. O produto deve permitir buscar cidades, visualizar o clima atual e a previsão para os próximos cinco dias, alternar entre Celsius e Fahrenheit e funcionar em dispositivos móveis.

O briefing não define público-alvo específico, fontes de dados, plataformas suportadas nem critérios quantitativos de desempenho. Esses pontos precisam ser esclarecidos antes de consolidar a especificação.

## Personas

As personas abaixo são hipóteses para orientar o discovery, não perfis validados por pesquisa com usuários.

- **Camila, pessoa que se desloca diariamente**
	- **Objetivo principal:** saber como estará o tempo antes de sair e decidir como se preparar para o trajeto.
	- **Contexto de uso:** principalmente no celular, em consultas rápidas antes de sair ou durante o deslocamento.
	- **Métrica de sucesso percebida:** encontrar a cidade e entender o clima atual e a previsão relevante em até 30 segundos, sem confundir a unidade.
- **André, planejador de viagem curta**
	- **Objetivo principal:** consultar o tempo no destino para planejar os próximos dias da viagem.
	- **Contexto de uso:** geralmente no desktop ao organizar a viagem; volta a consultar pelo celular durante o percurso.
	- **Métrica de sucesso percebida:** localizar o destino correto e revisar a previsão dos cinco dias em uma única consulta, em até dois minutos.
- **Renata, profissional que trabalha ao ar livre**
	- **Objetivo principal:** verificar as condições atuais e a previsão da cidade de trabalho para se preparar para a jornada.
	- **Contexto de uso:** principalmente no celular, por vezes em campo e com conexão limitada.
	- **Métrica de sucesso percebida:** obter a previsão da cidade correta em até 30 segundos e identificar claramente quando os dados foram atualizados.

## Requisitos Funcionais

- **RF-01 — Buscar cidades:** permitir que o usuário pesquise uma cidade pelo nome e selecione o local desejado entre os resultados.
- **RF-02 — Consultar clima atual:** exibir as condições meteorológicas atuais da cidade selecionada.
- **RF-03 — Consultar previsão:** exibir a previsão diária de hoje e dos quatro dias seguintes para a cidade selecionada.
- **RF-04 — Alternar unidades:** permitir alternar entre Celsius e Fahrenheit e apresentar as temperaturas na unidade escolhida.
- **RF-05 — Comunicar falhas:** quando não for possível buscar uma cidade ou obter dados meteorológicos, informar o usuário e não apresentar dados desatualizados como se fossem atuais.

## Requisitos Não-Funcionais

- **RNF-01 — Responsividade:** disponibilizar as funcionalidades principais em dispositivos móveis. Em telas a partir de 320 px de largura, a interface deve permitir busca e leitura das informações sem rolagem horizontal da página ou sobreposição de conteúdo.
- **RNF-02 — Usabilidade e clareza:** identificar claramente a unidade das temperaturas e associar cada previsão ao respectivo dia. Os controles principais devem ser utilizáveis em telas sensíveis ao toque.
- **RNF-03 — Performance:** responder a interações locais da interface em até 200 ms. Para buscas e consultas meteorológicas, apresentar resultado ou erro em até 3 s quando o serviço externo responder nesse prazo.
- **RNF-04 — Acessibilidade:** atender ao WCAG 2.2 nível AA, incluindo navegação por teclado, identificação acessível dos controles, contraste adequado e comunicação de estados de carregamento e erro a tecnologias assistivas.
- **RNF-05 — Disponibilidade:** definir uma meta mensal de disponibilidade para a aplicação; 99,5% é uma proposta inicial. Indisponibilidade de serviços externos deve ser tratada separadamente, com falha comunicada sem exibir dados como atuais.
- **RNF-06 — Compatibilidade:** definir os navegadores e sistemas operacionais suportados, incluindo versões mínimas para dispositivos móveis e desktop.
- **RNF-07 — Atualização dos dados:** definir a idade máxima aceitável dos dados meteorológicos exibidos como atuais e sinalizar dados que excedam esse limite.

As metas numéricas acima são propostas iniciais e precisam ser validadas com o negócio e a equipe técnica. Os limites de compatibilidade e atualização dos dados também precisam ser definidos.

## Riscos

As avaliações são iniciais, baseadas no briefing, e devem ser revistas após a validação das perguntas em aberto e dos termos do provedor selecionado.

| Risco | Probabilidade | Impacto | Estratégia de mitigação |
|---|---|---|---|
| Indisponibilidade, lentidão ou limite de requisições do provedor meteorológico. | Média | Alto: usuários podem ficar sem clima atual ou previsão. | Avaliar limites e nível de serviço antes da escolha; definir timeout, retentativas limitadas, monitoramento e comportamento de falha; considerar cache com horário visível e sinalização de dados desatualizados. |
| Dados meteorológicos imprecisos, incompletos ou desatualizados para a cidade selecionada. | Média | Alto: compromete a confiança e pode levar a decisões baseadas em condições incorretas. | Validar cobertura e atualização do provedor; exibir horário da observação; definir idade máxima dos dados e não rotular dados antigos como atuais. |
| Busca ambígua ou cobertura geográfica insuficiente. | Média | Alto: o usuário pode consultar a cidade errada ou não encontrar sua localidade. | Testar cidades e nomes alternativos das regiões-alvo; apresentar contexto como estado e país nos resultados; exigir seleção explícita quando houver homônimos. |
| Fuso horário da cidade causar divergência nas datas da previsão. | Média | Médio: a previsão pode parecer incompleta ou apresentar datas incorretas. | Definir o fuso usado para determinar o dia local; confirmar o suporte do provedor e associar cada previsão a uma data explícita. |
| Desempenho ruim em redes móveis ou dispositivos de menor capacidade. | Alta | Médio: consultas lentas podem aumentar abandono e dificultar o uso. | Definir metas de resposta; reduzir dados e recursos carregados; mostrar estados de carregamento; testar em dispositivos e condições de rede representativos. |
| Incompatibilidade móvel ou barreiras de acessibilidade. | Média | Alto: parte dos usuários pode não conseguir buscar ou interpretar a previsão. | Definir matriz de navegadores e dispositivos; validar responsividade, teclado, leitor de tela e contraste; incluir verificações automatizadas e testes manuais. |
| Dependência de um único provedor, com mudanças de preço, licença, cobertura ou API. | Média | Alto: pode exigir mudanças urgentes ou tornar a operação inviável. | Revisar termos, custos e limites do Open-Meteo antes da adoção; reduzir acoplamento da integração; monitorar mudanças e documentar uma alternativa de migração. |
| Coleta ou armazenamento de localização e histórico sem necessidade ou transparência. | Baixa | Alto: pode causar perda de confiança e riscos de privacidade ou conformidade. | Preferir busca manual como padrão; solicitar permissão apenas quando necessário; minimizar dados coletados e retidos e esclarecer seu uso. |
| Usuários esperarem alertas meteorológicos ou proteção para eventos severos que o produto não oferece. | Média | Alto: confiança indevida pode gerar consequências relevantes em situações de risco. | Definir explicitamente se alertas fazem parte do escopo; não sugerir que o app substitui alertas oficiais; se incluídos, usar fonte apropriada e validar cobertura e atualização. |
| Escopo crescer ou a solução não atender à necessidade prioritária do público. | Alta | Médio: atraso, retrabalho ou entrega de funcionalidades com baixo valor. | Validar público e problema com usuários; definir MVP, exclusões, critérios de aceite e métricas de sucesso antes de iniciar a implementação. |

## Decisões

- **Fonte de dados: Open-Meteo, sem API key.** A escolha reduz a necessidade de gerenciar uma chave de API para a integração inicial. Resolve qual provedor será usado; ainda é necessário confirmar termos de uso, limites, atribuição, cobertura e disponibilidade.
- **Previsão de cinco dias: hoje + quatro dias.** Define um período de cinco datas diárias e evita interpretar a previsão como cinco períodos móveis de 24 horas. Resolve a inclusão do dia atual e a contagem; o fuso horário que determina o “hoje” da cidade ainda precisa ser definido.
- **Unidade padrão: Celsius.** Estabelece um padrão inicial coerente com a localização pt-BR definida para a interface. Resolve qual unidade aparece inicialmente; não define se a escolha do usuário entre Celsius e Fahrenheit será salva.
- **Sem autenticação e sem persistência de servidor.** A consulta principal não exigirá conta, reduzindo escopo inicial e evitando armazenar dados de usuário no servidor. Resolve a necessidade de login e histórico/favoritos persistidos no servidor; não determina se preferências serão armazenadas localmente no navegador.
- **Idioma da interface: pt-BR.** Fixa o idioma da interface para esta versão e permite definir textos e formatos locais. Resolve qual idioma será suportado pela UI; não define o fuso horário da cidade nem a tradução de nomes e descrições fornecidos pela API.

## Perguntas em Aberto

Cada pergunta abaixo representa uma decisão não definida no briefing. O impacto descreve o risco de prosseguir sem esclarecê-la.

- **Público e necessidade:** quem são os usuários prioritários e em quais situações consultarão o app? **Impacto:** sem isso, prioridades de conteúdo e usabilidade podem não atender ao uso real.
- **Cobertura geográfica:** o app atenderá cidades globalmente ou apenas regiões específicas? **Impacto:** cobertura e qualidade de busca e dados variam conforme a região e o provedor.
- **Busca e desambiguação:** como a busca deve tratar nomes alternativos, localidades menores e cidades homônimas (por país, estado, código postal ou localização)? **Impacto:** usuários podem selecionar o local errado ou não encontrar a cidade desejada.
- **Conteúdo do clima atual:** quais informações devem ser exibidas além da condição geral, como temperatura, sensação térmica, vento, umidade e precipitação? **Impacto:** o escopo da interface e os dados necessários permanecem indefinidos.
- **Atualidade dos dados:** qual idade máxima dos dados permite apresentá-los como atuais? A interface deve mostrar horário da observação ou da última atualização? **Impacto:** dados antigos podem ser confundidos com condições presentes.
- **Fuso horário da previsão:** qual fuso deve determinar a data de “hoje” para cada cidade? **Impacto:** sem essa regra, os cinco dias podem começar em datas inconsistentes com o local consultado.
- **Detalhe da previsão:** será diária, horária ou ambas? Deve incluir máximas, mínimas, precipitação e condição? **Impacto:** a decisão altera os dados, a integração e a apresentação necessários.
- **Unidades:** Celsius e Fahrenheit se aplicam somente à temperatura? Quais unidades serão usadas para vento, precipitação e distância? **Impacto:** unidades inconsistentes podem confundir usuários e exigir conversões adicionais.
- **Persistência da unidade:** a escolha entre Celsius e Fahrenheit deve persistir durante a navegação ou após recarregar? Se sim, pode ser armazenada apenas no navegador? **Impacto:** sem essa definição, a preferência pode se perder ou ser armazenada de modo incompatível com a decisão de não persistir dados no servidor.
- **Localização:** o app deve solicitar localização para sugerir o clima local ou depender da busca manual? **Impacto:** afeta permissões, privacidade, experiência inicial e tratamento de localização negada.
- **Plataforma e dispositivos:** “usar em dispositivos móveis” significa site responsivo, aplicativo nativo ou ambos? Quais telas e sistemas serão suportados? **Impacto:** muda escopo, tecnologias, distribuição e estratégia de testes.
- **Formatos locais:** como datas, horários e números devem ser apresentados em pt-BR? **Impacto:** formatos inconsistentes podem dificultar a leitura e comparação das condições.
- **Falhas e estados sem dados:** como tratar carregamento, busca sem resultados, falta de conexão, falha do provedor e dados desatualizados? Deve haver opção de tentar novamente? **Impacto:** sem regras, falhas podem parecer bugs ou dados antigos podem ser exibidos sem contexto.
- **Termos e integração do provedor:** quais limites, custos, requisitos de atribuição e garantias de disponibilidade se aplicam ao Open-Meteo? A API será consultada diretamente pelo navegador ou por um backend sem persistência? **Impacto:** restrições podem afetar viabilidade e operação; a forma de integração afeta arquitetura, cache e resiliência.
- **Performance e disponibilidade:** quais metas são aceitáveis e como serão medidas, considerando serviços externos? **Impacto:** não haverá critério objetivo para avaliar qualidade ou orientar decisões de infraestrutura e contingência.
- **Acessibilidade:** qual nível deve ser atendido para navegação por teclado, leitores de tela, contraste e controles? **Impacto:** usuários podem ser excluídos e correções tardias podem exigir mudanças estruturais.
- **Privacidade e retenção:** serão armazenadas localização, cidades pesquisadas ou preferências? Por quanto tempo e com qual consentimento? **Impacto:** coleta não planejada pode gerar riscos de privacidade, conformidade e confiança.
- **Alertas meteorológicos:** alertas de eventos severos fazem parte do produto ou estão fora do escopo? **Impacto:** usuários podem esperar alertas que não existem; incluí-los amplia integrações e requisitos operacionais.
- **MVP e sucesso:** o que está dentro e fora da primeira versão e quais métricas indicarão sucesso? **Impacto:** sem limites e critérios de resultado, há risco de expansão de escopo e de não demonstrar valor para o negócio.

## Suposições

- A busca é feita pelo nome da cidade, sem exigir que o usuário compartilhe sua localização.
- O usuário seleciona uma cidade antes de consultar seus dados meteorológicos.
- “Previsão de 5 dias” significa hoje e os quatro dias seguintes, em granularidade diária.
- Celsius e Fahrenheit são as únicas unidades de temperatura necessárias nesta versão.
- A aplicação será acessada por navegador em dispositivos móveis; o briefing não exige um aplicativo nativo.
- O Open-Meteo é a fonte de dados meteorológicos selecionada e será usado sem API key.
- A ausência de autenticação e persistência de servidor não define se preferências serão armazenadas localmente no navegador.
- As metas numéricas de performance e disponibilidade são propostas para discussão, não compromissos aprovados.