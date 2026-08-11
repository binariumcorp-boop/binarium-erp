// ============================================================
// config.js
// DADOS INICIAIS
// Extraido de DOC-20260805-WA0010.html sem alteracao logica.
// ============================================================

'use strict';

// ===== DADOS INICIAIS =====
function initializeData() {
  if (StorageService.get(DB.KEYS.initialized)) return;

  // Obras
  const obras = [
    { id:1, nome:'E.E. Visconde do Cairu', codigo:'OBR-001', municipio:'Santa Rosa – RS', licitacao:'Pregão Eletrônico', objeto:'Reforma e ampliação de escola estadual', responsavel:'Ysmael Q. Nunes', status:'Em Andamento', valor:680000, progresso:72, inicio:'2025-02-10', termino:'2025-06-15', createdAt:'2025-02-10T08:00:00.000Z', updatedAt:'2025-02-10T08:00:00.000Z' },
    { id:2, nome:'E.M. São José', codigo:'OBR-002', municipio:'Cândido Godói – RS', licitacao:'Pregão Eletrônico', objeto:'Reforma de escola municipal', responsavel:'Ysmael Q. Nunes', status:'Concluindo', valor:540000, progresso:91, inicio:'2025-01-15', termino:'2025-04-30', createdAt:'2025-01-15T08:00:00.000Z', updatedAt:'2025-01-15T08:00:00.000Z' },
    { id:3, nome:'E.E. Marechal Rondon', codigo:'OBR-003', municipio:'Santo Ângelo – RS', licitacao:'Concorrência', objeto:'Reforma geral de escola estadual', responsavel:'Ysmael Q. Nunes', status:'Atrasada', valor:920000, progresso:45, inicio:'2025-01-20', termino:'2025-05-20', createdAt:'2025-01-20T08:00:00.000Z', updatedAt:'2025-01-20T08:00:00.000Z' },
    { id:4, nome:'E.M. Nossa Sra. Aparecida', codigo:'OBR-004', municipio:'Três de Maio – RS', licitacao:'Pregão Eletrônico', objeto:'Reforma de escola municipal', responsavel:'Ysmael Q. Nunes', status:'Em Andamento', valor:760000, progresso:58, inicio:'2025-02-01', termino:'2025-07-30', createdAt:'2025-02-01T08:00:00.000Z', updatedAt:'2025-02-01T08:00:00.000Z' },
    { id:5, nome:'E.E. Getúlio Vargas', codigo:'OBR-005', municipio:'Horizontina – RS', licitacao:'Tomada de Preços', objeto:'Reforma de escola estadual', responsavel:'Ysmael Q. Nunes', status:'Em Andamento', valor:580000, progresso:34, inicio:'2025-03-01', termino:'2025-08-15', createdAt:'2025-03-01T08:00:00.000Z', updatedAt:'2025-03-01T08:00:00.000Z' },
    { id:6, nome:'E.M. Tiradentes', codigo:'OBR-006', municipio:'Giruá – RS', licitacao:'Pregão Eletrônico', objeto:'Reforma de escola municipal', responsavel:'Ysmael Q. Nunes', status:'Planejada', valor:310000, progresso:0, inicio:'2025-05-01', termino:'2025-09-30', createdAt:'2025-04-01T08:00:00.000Z', updatedAt:'2025-04-01T08:00:00.000Z' },
    { id:7, nome:'E.E. Borges de Medeiros', codigo:'OBR-007', municipio:'Ijuí – RS', licitacao:'Concorrência', objeto:'Reforma e modernização', responsavel:'Ysmael Q. Nunes', status:'Concluída', valor:420000, progresso:100, inicio:'2024-09-01', termino:'2025-02-28', createdAt:'2024-09-01T08:00:00.000Z', updatedAt:'2025-02-28T08:00:00.000Z' },
    { id:8, nome:'E.M. Dom Pedro II', codigo:'OBR-008', municipio:'Panambi – RS', licitacao:'Pregão Eletrônico', objeto:'Reforma de escola municipal', responsavel:'Ysmael Q. Nunes', status:'Concluída', valor:290000, progresso:100, inicio:'2024-08-01', termino:'2025-01-31', createdAt:'2024-08-01T08:00:00.000Z', updatedAt:'2025-01-31T08:00:00.000Z' }
  ];
  DB.set('obras', obras);

  // Serviços
  const servicos = [
    { id:1, nome:'Reforma Banheiros – Bloco B', obraId:1, obraNome:'E.E. Visconde do Cairu', etapa:'Revestimentos', responsavel:'João Santos', valorContratado:98000, custoOrcado:72000, valorExecutado:70560, custoExecutado:51840, progresso:72, status:'Em Andamento', inicio:'2025-02-15', prazo:'2025-05-15', createdAt:'2025-02-15T08:00:00.000Z', updatedAt:'2025-02-15T08:00:00.000Z' },
    { id:2, nome:'Instalação Elétrica Predial', obraId:1, obraNome:'E.E. Visconde do Cairu', etapa:'Instalações', responsavel:'Marcos Lima', valorContratado:145000, custoOrcado:110000, valorExecutado:104400, custoExecutado:79200, progresso:72, status:'Em Andamento', inicio:'2025-02-20', prazo:'2025-06-10', createdAt:'2025-02-20T08:00:00.000Z', updatedAt:'2025-02-20T08:00:00.000Z' },
    { id:3, nome:'Pintura Geral', obraId:2, obraNome:'E.M. São José', etapa:'Acabamento', responsavel:'Ricardo Oliveira', valorContratado:62000, custoOrcado:45000, valorExecutado:56420, custoExecutado:40950, progresso:91, status:'Em Andamento', inicio:'2025-01-20', prazo:'2025-04-25', createdAt:'2025-01-20T08:00:00.000Z', updatedAt:'2025-01-20T08:00:00.000Z' },
    { id:4, nome:'Reforma Estrutural', obraId:3, obraNome:'E.E. Marechal Rondon', etapa:'Estrutura', responsavel:'Pedro Almeida', valorContratado:320000, custoOrcado:250000, valorExecutado:144000, custoExecutado:112500, progresso:45, status:'Atrasado', inicio:'2025-01-25', prazo:'2025-04-30', createdAt:'2025-01-25T08:00:00.000Z', updatedAt:'2025-01-25T08:00:00.000Z' },
    { id:5, nome:'Hidráulica Completa', obraId:4, obraNome:'E.M. Nossa Sra. Aparecida', etapa:'Instalações', responsavel:'Pedro Almeida', valorContratado:88000, custoOrcado:65000, valorExecutado:51040, custoExecutado:37700, progresso:58, status:'Em Andamento', inicio:'2025-02-05', prazo:'2025-07-20', createdAt:'2025-02-05T08:00:00.000Z', updatedAt:'2025-02-05T08:00:00.000Z' }
  ];
  DB.set('servicos', servicos);

  // Equipe
  const equipe = [
    { id:1, nome:'Ysmael Q. Nunes', cpf:'123.456.789-00', funcao:'Engenheiro', telefone:'(55) 99999-0000', obraId:1, obraNome:'E.E. Visconde do Cairu', admissao:'2020-01-15', status:'Ativo', salario:8500, obs:'Engenheiro responsável', createdAt:'2020-01-15T08:00:00.000Z', updatedAt:'2020-01-15T08:00:00.000Z' },
    { id:2, nome:'João Santos', cpf:'234.567.890-11', funcao:'Pedreiro', telefone:'(55) 98888-1111', obraId:1, obraNome:'E.E. Visconde do Cairu', admissao:'2022-03-01', status:'Ativo', salario:2800, obs:'', createdAt:'2022-03-01T08:00:00.000Z', updatedAt:'2022-03-01T08:00:00.000Z' },
    { id:3, nome:'Luis Ferreira', cpf:'345.678.901-22', funcao:'Azulejista', telefone:'(55) 97777-2222', obraId:2, obraNome:'E.M. São José', admissao:'2021-06-15', status:'Ativo', salario:3200, obs:'', createdAt:'2021-06-15T08:00:00.000Z', updatedAt:'2021-06-15T08:00:00.000Z' },
    { id:4, nome:'Pedro Almeida', cpf:'456.789.012-33', funcao:'Encanador', telefone:'(55) 96666-3333', obraId:3, obraNome:'E.E. Marechal Rondon', admissao:'2023-01-10', status:'Ativo', salario:3000, obs:'EPIs pendentes', createdAt:'2023-01-10T08:00:00.000Z', updatedAt:'2023-01-10T08:00:00.000Z' },
    { id:5, nome:'Marcos Lima', cpf:'567.890.123-44', funcao:'Eletricista', telefone:'(55) 95555-4444', obraId:4, obraNome:'E.M. Nossa Sra. Aparecida', admissao:'2022-08-20', status:'Ativo', salario:3500, obs:'Documento a vencer', createdAt:'2022-08-20T08:00:00.000Z', updatedAt:'2022-08-20T08:00:00.000Z' },
    { id:6, nome:'Ricardo Oliveira', cpf:'678.901.234-55', funcao:'Pintor', telefone:'(55) 94444-5555', obraId:5, obraNome:'E.E. Getúlio Vargas', admissao:'2021-11-05', status:'Inativo', salario:2600, obs:'Afastado por motivo de saúde', createdAt:'2021-11-05T08:00:00.000Z', updatedAt:'2021-11-05T08:00:00.000Z' }
  ];
  DB.set('equipe', equipe);

  // Financeiro
  const financeiro = [
    { id:1, tipo:'entrada', data:'2025-04-01', descricao:'Medição #1 – E.E. Visconde do Cairu', obraId:1, obraNome:'E.E. Visconde do Cairu', categoria:'Medição', valor:204000, status:'Pago', obs:'', createdAt:'2025-04-01T08:00:00.000Z', updatedAt:'2025-04-01T08:00:00.000Z' },
    { id:2, tipo:'entrada', data:'2025-04-05', descricao:'Medição #2 – E.M. São José', obraId:2, obraNome:'E.M. São José', categoria:'Medição', valor:491400, status:'Pago', obs:'', createdAt:'2025-04-05T08:00:00.000Z', updatedAt:'2025-04-05T08:00:00.000Z' },
    { id:3, tipo:'saida', data:'2025-04-10', descricao:'Folha de Pagamento – Abril', obraId:null, obraNome:'Geral', categoria:'Folha', valor:85000, status:'Pago', obs:'Pagamento de todos os colaboradores', createdAt:'2025-04-10T08:00:00.000Z', updatedAt:'2025-04-10T08:00:00.000Z' },
    { id:4, tipo:'saida', data:'2025-04-12', descricao:'Fornecedor Materiais – Cimento e Areia', obraId:1, obraNome:'E.E. Visconde do Cairu', categoria:'Material', valor:42000, status:'Pago', obs:'NF 12345', createdAt:'2025-04-12T08:00:00.000Z', updatedAt:'2025-04-12T08:00:00.000Z' },
    { id:5, tipo:'entrada', data:'2025-04-15', descricao:'Medição #1 – E.E. Marechal Rondon', obraId:3, obraNome:'E.E. Marechal Rondon', categoria:'Medição', valor:414000, status:'Pago', obs:'', createdAt:'2025-04-15T08:00:00.000Z', updatedAt:'2025-04-15T08:00:00.000Z' },
    { id:6, tipo:'saida', data:'2025-04-20', descricao:'Seguro de Obras', obraId:null, obraNome:'Geral', categoria:'Outros', valor:12500, status:'Pendente', obs:'Vence em 10/05', createdAt:'2025-04-20T08:00:00.000Z', updatedAt:'2025-04-20T08:00:00.000Z' },
    { id:7, tipo:'entrada', data:'2025-04-22', descricao:'Medição #1 – E.M. Nossa Sra. Aparecida', obraId:4, obraNome:'E.M. Nossa Sra. Aparecida', categoria:'Medição', valor:440800, status:'Pendente', obs:'Aguardando aprovação', createdAt:'2025-04-22T08:00:00.000Z', updatedAt:'2025-04-22T08:00:00.000Z' },
    { id:8, tipo:'saida', data:'2025-04-25', descricao:'Materiais Elétricos', obraId:4, obraNome:'E.M. Nossa Sra. Aparecida', categoria:'Material', valor:28000, status:'Pago', obs:'', createdAt:'2025-04-25T08:00:00.000Z', updatedAt:'2025-04-25T08:00:00.000Z' }
  ];
  DB.set('financeiro', financeiro);

  // Estoque
  const estoque = [
    { id:1, nome:'Cimento Portland CP-II', categoria:'Material', unidade:'Saco', qtd:240, minimo:100, valorUnit:32, obraId:1, obraNome:'E.E. Visconde do Cairu', createdAt:'2025-02-10T08:00:00.000Z', updatedAt:'2025-02-10T08:00:00.000Z' },
    { id:2, nome:'Areia Média', categoria:'Material', unidade:'m³', qtd:18, minimo:10, valorUnit:85, obraId:1, obraNome:'E.E. Visconde do Cairu', createdAt:'2025-02-10T08:00:00.000Z', updatedAt:'2025-02-10T08:00:00.000Z' },
    { id:3, nome:'Cerâmica 45x45 Bege', categoria:'Revestimento', unidade:'m²', qtd:320, minimo:200, valorUnit:28, obraId:1, obraNome:'E.E. Visconde do Cairu', createdAt:'2025-02-15T08:00:00.000Z', updatedAt:'2025-02-15T08:00:00.000Z' },
    { id:4, nome:'Tinta Acrílica Branca', categoria:'Pintura', unidade:'Lata', qtd:40, minimo:50, valorUnit:65, obraId:2, obraNome:'E.M. São José', createdAt:'2025-01-20T08:00:00.000Z', updatedAt:'2025-01-20T08:00:00.000Z' },
    { id:5, nome:'Cano PVC 100mm', categoria:'Hidráulico', unidade:'m', qtd:85, minimo:30, valorUnit:12, obraId:4, obraNome:'E.M. Nossa Sra. Aparecida', createdAt:'2025-02-05T08:00:00.000Z', updatedAt:'2025-02-05T08:00:00.000Z' },
    { id:6, nome:'Fio Elétrico 2,5mm', categoria:'Elétrico', unidade:'m', qtd:15, minimo:50, valorUnit:4.5, obraId:1, obraNome:'E.E. Visconde do Cairu', createdAt:'2025-02-20T08:00:00.000Z', updatedAt:'2025-02-20T08:00:00.000Z' },
    { id:7, nome:'Brita Nº 1', categoria:'Material', unidade:'m³', qtd:8, minimo:15, valorUnit:120, obraId:3, obraNome:'E.E. Marechal Rondon', createdAt:'2025-01-25T08:00:00.000Z', updatedAt:'2025-01-25T08:00:00.000Z' },
    { id:8, nome:'Argamassa AC-III', categoria:'Revestimento', unidade:'Saco', qtd:180, minimo:80, valorUnit:22, obraId:1, obraNome:'E.E. Visconde do Cairu', createdAt:'2025-02-15T08:00:00.000Z', updatedAt:'2025-02-15T08:00:00.000Z' }
  ];
  DB.set('estoque', estoque);

  // Diário
  const diario = [
    { id:1, obraId:1, obraNome:'E.E. Visconde do Cairu', data:'2025-04-25', tipo:'Atividade', titulo:'Assentamento de cerâmica – Banheiros Bloco B', descricao:'Equipe de 4 azulejistas realizou o assentamento de 80m² de cerâmica nos banheiros do Bloco B. Material utilizado: Cerâmica 45x45 Bege e Argamassa AC-III.', colaboradores:8, responsavel:'Ysmael Q. Nunes', clima:'Ensolarado', equipamentos:'Betoneira, Andaime', servicos:'Assentamento cerâmica, Rejuntamento', createdAt:'2025-04-25T08:00:00.000Z', updatedAt:'2025-04-25T08:00:00.000Z' },
    { id:2, obraId:1, obraNome:'E.E. Visconde do Cairu', data:'2025-04-24', tipo:'Ocorrência', titulo:'Chuva interrompeu serviços externos', descricao:'Chuva intensa durante a tarde impediu a continuidade dos serviços externos. Equipe realocada para serviços internos.', colaboradores:12, responsavel:'João Santos', clima:'Chuvoso', equipamentos:'Nenhum', servicos:'Serviços internos', createdAt:'2025-04-24T08:00:00.000Z', updatedAt:'2025-04-24T08:00:00.000Z' },
    { id:3, obraId:2, obraNome:'E.M. São José', data:'2025-04-25', tipo:'Atividade', titulo:'Pintura final – Fachada principal', descricao:'Aplicação da segunda demão de tinta acrílica na fachada principal. Serviço praticamente concluído.', colaboradores:6, responsavel:'Ricardo Oliveira', clima:'Ensolarado', equipamentos:'Andaime, Rolo de pintura', servicos:'Pintura fachada', createdAt:'2025-04-25T08:00:00.000Z', updatedAt:'2025-04-25T08:00:00.000Z' },
    { id:4, obraId:3, obraNome:'E.E. Marechal Rondon', data:'2025-04-23', tipo:'Inspeção', titulo:'Vistoria técnica – Estrutura Bloco C', descricao:'Vistoria técnica realizada pelo engenheiro responsável. Identificadas pendências na estrutura do Bloco C que necessitam de reforço.', colaboradores:3, responsavel:'Ysmael Q. Nunes', clima:'Nublado', equipamentos:'Nenhum', servicos:'Vistoria', createdAt:'2025-04-23T08:00:00.000Z', updatedAt:'2025-04-23T08:00:00.000Z' }
  ];
  DB.set('diario', diario);

  // Cronograma
  const cronograma = [
    { id:1, nome:'Demolição e Preparação', obraId:1, obraNome:'E.E. Visconde do Cairu', etapa:'Preparação', inicio:'2025-02-10', fim:'2025-02-28', progresso:100, status:'Concluída', responsavel:'João Santos', createdAt:'2025-02-10T08:00:00.000Z', updatedAt:'2025-02-10T08:00:00.000Z' },
    { id:2, nome:'Instalação Hidráulica', obraId:1, obraNome:'E.E. Visconde do Cairu', etapa:'Instalações', inicio:'2025-03-01', fim:'2025-03-31', progresso:100, status:'Concluída', responsavel:'Pedro Almeida', createdAt:'2025-03-01T08:00:00.000Z', updatedAt:'2025-03-01T08:00:00.000Z' },
    { id:3, nome:'Revestimento Cerâmico', obraId:1, obraNome:'E.E. Visconde do Cairu', etapa:'Revestimentos', inicio:'2025-04-01', fim:'2025-05-15', progresso:60, status:'Em Andamento', responsavel:'Luis Ferreira', createdAt:'2025-04-01T08:00:00.000Z', updatedAt:'2025-04-01T08:00:00.000Z' },
    { id:4, nome:'Instalação Elétrica', obraId:1, obraNome:'E.E. Visconde do Cairu', etapa:'Instalações', inicio:'2025-04-15', fim:'2025-06-10', progresso:40, status:'Em Andamento', responsavel:'Marcos Lima', createdAt:'2025-04-15T08:00:00.000Z', updatedAt:'2025-04-15T08:00:00.000Z' },
    { id:5, nome:'Pintura Geral', obraId:1, obraNome:'E.E. Visconde do Cairu', etapa:'Acabamento', inicio:'2025-05-20', fim:'2025-06-15', progresso:0, status:'Não Iniciada', responsavel:'Ricardo Oliveira', createdAt:'2025-04-01T08:00:00.000Z', updatedAt:'2025-04-01T08:00:00.000Z' },
    { id:6, nome:'Reforma Estrutural', obraId:3, obraNome:'E.E. Marechal Rondon', etapa:'Estrutura', inicio:'2025-01-25', fim:'2025-04-30', progresso:45, status:'Atrasada', responsavel:'Pedro Almeida', createdAt:'2025-01-25T08:00:00.000Z', updatedAt:'2025-01-25T08:00:00.000Z' }
  ];
  DB.set('cronograma', cronograma);

  // Contratos
  const contratos = [
    { id:1, numero:'CT-2025-001', categoria:'Reforma Geral', fornecedor:'Construtora Forte Ltda.', cnpj:'12.345.678/0001-90', objeto:'Execução civil – Santa Rosa', obraId:1, obraNome:'E.E. Visconde do Cairu', pagamento:'Medido', valor:1850000, valorExecutado:1110000, status:'Ativo', inicio:'2025-02-10', termino:'2025-06-30', createdAt:'2025-02-10T08:00:00.000Z', updatedAt:'2025-02-10T08:00:00.000Z' },
    { id:2, numero:'CT-2025-002', categoria:'Elétrica', fornecedor:'Eletrix Soluções Ltda.', cnpj:'23.456.789/0001-01', objeto:'Instalações elétricas prediais', obraId:1, obraNome:'E.E. Visconde do Cairu', pagamento:'Medido', valor:720000, valorExecutado:288000, status:'Ativo', inicio:'2025-06-10', termino:'2025-09-30', createdAt:'2025-02-15T08:00:00.000Z', updatedAt:'2025-02-15T08:00:00.000Z' },
    { id:3, numero:'CT-2025-003', categoria:'Revestimento', fornecedor:'Vidro & Cia Ltda.', cnpj:'34.567.890/0001-02', objeto:'Fornecimento de pisos e azulejos', obraId:1, obraNome:'E.E. Visconde do Cairu', pagamento:'À Vista', valor:420000, valorExecutado:252000, status:'Ativo', inicio:'2025-02-05', termino:'2025-06-10', createdAt:'2025-02-05T08:00:00.000Z', updatedAt:'2025-02-05T08:00:00.000Z' },
    { id:4, numero:'CT-2025-004', categoria:'Pintura', fornecedor:'Revest Mais Ltda.', cnpj:'45.678.901/0001-03', objeto:'Pintura interna e externa', obraId:2, obraNome:'E.M. São José', pagamento:'Medido', valor:860000, valorExecutado:430000, status:'Ativo', inicio:'2025-04-20', termino:'2025-08-25', createdAt:'2025-04-20T08:00:00.000Z', updatedAt:'2025-04-20T08:00:00.000Z' },
    { id:5, numero:'CT-2025-005', categoria:'Limpeza', fornecedor:'Limp Clean Serviços', cnpj:'56.789.012/0001-04', objeto:'Limpeza final e entrega', obraId:2, obraNome:'E.M. São José', pagamento:'À Vista', valor:90000, valorExecutado:90000, status:'Vencido', inicio:'2025-04-01', termino:'2025-04-30', createdAt:'2025-04-01T08:00:00.000Z', updatedAt:'2025-04-01T08:00:00.000Z' }
  ];
  DB.set('contratos', contratos);

  // Documentos
  const documentos = [
    { id:1, nome:'Projeto Arquitetônico – E.E. Visconde do Cairu', categoria:'Projeto', obraId:1, obraNome:'E.E. Visconde do Cairu', versao:'v2.1', status:'Aprovado', tamanho:'4.2 MB', tipo:'pdf', favorito:true, uploadAt:'2025-02-10', obs:'Projeto aprovado pela prefeitura', createdAt:'2025-02-10T08:00:00.000Z', updatedAt:'2025-02-10T08:00:00.000Z' },
    { id:2, nome:'Contrato CT-2025-001', categoria:'Contrato', obraId:1, obraNome:'E.E. Visconde do Cairu', versao:'v1.0', status:'Aprovado', tamanho:'1.8 MB', tipo:'pdf', favorito:false, uploadAt:'2025-02-10', obs:'', createdAt:'2025-02-10T08:00:00.000Z', updatedAt:'2025-02-10T08:00:00.000Z' },
    { id:3, nome:'Licença de Construção – Santa Rosa', categoria:'Licença', obraId:1, obraNome:'E.E. Visconde do Cairu', versao:'v1.0', status:'Aprovado', tamanho:'0.8 MB', tipo:'pdf', favorito:true, uploadAt:'2025-02-08', obs:'', createdAt:'2025-02-08T08:00:00.000Z', updatedAt:'2025-02-08T08:00:00.000Z' },
    { id:4, nome:'Medição #1 – Cândido Godói', categoria:'Medição', obraId:2, obraNome:'E.M. São José', versao:'v1.0', status:'Aprovado', tamanho:'2.1 MB', tipo:'pdf', favorito:false, uploadAt:'2025-04-05', obs:'', createdAt:'2025-04-05T08:00:00.000Z', updatedAt:'2025-04-05T08:00:00.000Z' },
    { id:5, nome:'Projeto Hidráulico – E.M. Nossa Sra. Aparecida', categoria:'Projeto', obraId:4, obraNome:'E.M. Nossa Sra. Aparecida', versao:'v1.2', status:'Pendente', tamanho:'3.5 MB', tipo:'pdf', favorito:false, uploadAt:'2025-02-15', obs:'Aguardando revisão', createdAt:'2025-02-15T08:00:00.000Z', updatedAt:'2025-02-15T08:00:00.000Z' }
  ];
  DB.set('documentos', documentos);

  // Config padrão
  DB.setConfig({
    empresa: { nome: 'MB SOLUÇÕES', slogan: 'Serralheria e Funilaria', cnpj: '12.345.678/0001-90', email: 'contato@mbsolucoes.com.br', tel: '(53) 98465-4318', site: 'www.mbsolucoes.com.br', end: 'Rua das Indústrias, s/n – RS', razao: '', fantasia: '', ie: '', whatsapp: '', responsavel: '', cidade: '', estado: '', cep: '' },
    aparencia: { cor: '#1a56db', sidebarBg: '#0f1729', logoLetra: 'M' },
    // Namespace de white-label / identidade visual. Nunca inclui a marca
    // BinariumCorp, que é fixa e não configurável por esta tela.
    erp: {
      nome: '', boasVindas: 'Gestão completa<br>para suas obras', descLogin: 'Acompanhe o andamento, controle custos, gerencie sua equipe e tenha total visibilidade dos seus projetos em um só lugar.',
      tema: 'escuro', corSecundaria: '', corBotoes: '', corTopo: '',
      logoImg: '', faviconImg: '',
      loginImgState: 'default', loginImg: '', loginImgPos: 'center', loginImgZoom: 100, loginImgOpacity: 100
    },
    sistema: { dataFormat: 'DD/MM/AAAA', idioma: 'pt-BR', moeda: 'BRL', fuso: 'America/Sao_Paulo' },
    notificacoes: { prazos: true, estoque: true, docs: true, whatsapp: false }
  });

  StorageService.set(DB.KEYS.initialized, true);
}

