-- ============================================================
-- Seed: 39 unidades prediais do TJRO + 30 comarcas
-- Origem: planilha Google Sheets enviada pelo usuário em 2026-05-12
-- Idempotente: comarcas via ON CONFLICT (nome), unidades via NOT EXISTS (nome)
-- ============================================================

BEGIN;

-- =========================================
-- 1) Comarcas
-- =========================================
INSERT INTO public.comarcas (nome) VALUES
  ('Alta Floresta'),
  ('Alvorada'),
  ('Alto Paraíso'),
  ('Ariquemes'),
  ('Buritis'),
  ('Cacoal'),
  ('Campo Novo'),
  ('Candeias'),
  ('Cerejeiras'),
  ('Chupinguaia'),
  ('Colorado'),
  ('Costa Marques'),
  ('Cujubim'),
  ('Espigão do Oeste'),
  ('Guajará-Mirim'),
  ('Jaru'),
  ('Ji-Paraná'),
  ('Machadinho'),
  ('Mirante da Serra'),
  ('Monte Negro'),
  ('Nova Brasilândia'),
  ('Ouro Preto'),
  ('Pimenta Bueno'),
  ('Porto Velho'),
  ('Presidente Médici'),
  ('Rolim de Moura'),
  ('Santa Luzia'),
  ('São Francisco'),
  ('São Miguel'),
  ('Vilhena')
ON CONFLICT (nome) DO NOTHING;

-- =========================================
-- 2) Unidades prediais
-- =========================================
WITH seed (
  nome, comarca_nome, endereco, telefone, responsavel_local,
  responsavel_substituto, lat, lng, possui_derso, controle_acesso, vigilancia_eletronica
) AS (
  VALUES
  ('Fórum Ministro Aliomar Baleeiro – Alta Floresta do Oeste - RO', 'Alta Floresta',
   'Avenida Mato Grosso, esq. c/ Rua Ceará – Centro - Alta Floresta do Oeste – RO – CEP 76954-000',
   '(69) 3309-8414', 'Valter Pimenta da Silva', '',
   -11.927110535711824::float8, -61.99112931548914::float8, true, true, true),

  ('Fórum Jurista Júlio Guimarães Lima – Alvorada do Oeste – RO', 'Alvorada',
   'Rua Vinicius de Morais n. 4308 – Centro Alvorada do Oeste – RO – CEP 76930-000',
   '(69) 3309-8295', 'Sebastião de Ataíde Silva', 'Gildete Almeida',
   -11.353872292593131, -62.28492595967439, true, true, true),

  ('Fórum Juiz Edelçon Inocêncio - Ariquemes - RO', 'Ariquemes',
   'Avenida Tancredo Neves n. 2606 – Centro - Ariquemes – RO – CEP 76880-000',
   '(69) 3309-8145', 'Clédson Peres de Souza', 'Claudenor Lemes Santana',
   -9.90987728384404, -63.032185073182575, true, true, true),

  ('Fórum Jorge Gurgel do Amaral Neto – Buritis – RO', 'Buritis',
   'Rua Taguatinga n. 1380 – Setor 3 - Buritis – RO – CEP 76880-000',
   '(69) 3309-8745', 'Geronilson Richard Pinto', 'Hiram Pasian',
   -10.208352332902283, -63.828764518614385, true, true, true),

  ('Fórum Desembargador Aldo Alberto Castanheira Silva - Cacoal – RO', 'Cacoal',
   'Avenida Cuiabá, n. 2025 – Centro Cacoal – RO – CEP 76963-731',
   '(69) 3309-8000', 'Wilson Pereira da Rocha Neto', 'Marcos Paulino Anacleto',
   -11.435185319116266, -61.453658730837624, true, true, true),

  ('Fórum Sobral Pinto – Cerejeiras – RO', 'Cerejeiras',
   'Avenida das Nações n. 2525 – Centro Cerejeiras – RO – CEP 76997-000',
   '(69) 3309-8345', 'Moacir Perroni', 'José Carlos',
   -13.188527870060794, -60.817520230817294, true, true, true),

  ('Fórum Juiz Joel Quaresma Moura – Colorado do Oeste – RO', 'Colorado',
   'Rua Humaitá n. 3879 – Centro - Colorado do Oeste – RO – 76993-000',
   '(69) 3341-7750', 'Irineu Antônio Canale', 'Leori Antonio Breitenbach',
   -13.121674013139202, -60.543235713624874, true, true, true),

  ('Fórum Susy Soares Silva Gomes – Costa Marques – RO', 'Costa Marques',
   'Avenida Chianca n. 1061 – Centro – Costa Marques – RO – CEP 76937-000',
   '(69) 3309-8361', 'Carlos Augusto', 'Ney Mendes de Souza',
   -12.440589857060509, -64.22887686640831, true, true, true),

  ('Fórum Ministro Miguel Seabra Fagundes – Espigão do Oeste – RO', 'Espigão do Oeste',
   'Rua Vale Formoso n. 1954 – Bairro Vista Alegre - Espigão do Oeste – RO – CEP 76974-000',
   '(69) 3309-8245', 'Telma Maria Soares de Oliveira', 'Rosangela Vital',
   -11.535084043013004, -61.01569423083656, true, true, true),

  ('Fórum Nelson Hungria – Guajará Mirim – RO', 'Guajará-Mirim',
   'Avenida XV de Novembro s/n – Bairro Serraria - Guajará Mirim – RO – CEP 76850-000',
   '(69) 3516-4511', 'Francisco Oátomo', 'Rosa Solani',
   -10.780601794595611, -65.33414524433739, true, true, true),

  ('Fórum Ministro Victor Nunes Leal – Jaru – RO', 'Jaru',
   'Rua Raimundo Cantanhede n. 1080 Jaru – RO – CEP 76980-000',
   '(69) 3521-0250', 'Cleudiana Meneguci', 'Ozir Oliveira Alves',
   -10.43808422554936, -62.46166527317703, true, true, true),

  ('Fórum Desembargador Sérgio Alberto Nogueira de Lima – Ji-Paraná – RO', 'Ji-Paraná',
   'Avenida Brasil n. 595 – Ji-Paraná – CEP 76908-594',
   '(69) 3411-2950', 'Otávio Polichuk', 'Ney Dias Pereira',
   -10.887729962000785, -61.92491167041111, true, true, true),

  ('Fórum José Pedro do Couto – Machadinho do Oeste – RO', 'Machadinho',
   'Rua Tocantins n. 3029 – Centro - Machadinho do Oeste – RO – CEP 76868-000',
   '(69) 4020-2245', 'Elivelton Pereira da Silva', '',
   -9.427022043975434, -62.00734271736608, true, true, true),

  ('Fórum Juiz José de Melo Silva – Nova Brasilândia – RO', 'Nova Brasilândia',
   'R. Príncipe da Beira, 1491 - Centro, Nova Brasilândia D''Oeste - RO, 76958-000',
   '(69) 3309-8695', '', '',
   -11.72164910187845, -62.31307885967033, true, true, true),

  ('Fórum Desembargador Cássio Rodolfo Sbarzi Guedes – Ouro Preto do Oeste – RO', 'Ouro Preto',
   'Av. Daniel Comboni, 1480 - União, Ouro Preto do Oeste - RO, 76920-000',
   '(69) 3416-1750', 'Terezinha Vieira', '',
   -10.721457466291266, -62.25714344618835, true, true, true),

  ('Fórum Professor Pontes de Miranda – Presidente Médici – RO', 'Presidente Médici',
   'Av. Castelo Branco n. 2667 – Centro Presidente Médici – RO – CEP 76916-000',
   '(69) 3309-8195', 'Adriano Carlos', '',
   -11.169920753864847, -61.904748688512164, true, true, true),

  ('Fórum Ministro Hermes de Lima – Pimenta Bueno – RO', 'Pimenta Bueno',
   'Rua Casimiro de Abreu n. 237 – Centro Pimenta Bueno – RO – CEP 76970-000',
   '(69) 3452-0950', 'Evelyn Schneider N. de A. Sarmento', '',
   -11.672131353648144, -61.187790328984775, true, true, true),

  ('Fórum Juiz Eurico Soares Montenegro – Rolim de Moura – RO', 'Rolim de Moura',
   'Avenida João Pessoa n. 4555 – Centro - Rolim de Moura – RO – CEP 76940-000',
   '(69) 3449-3750', 'Vande Luciano Marcelino', '',
   -11.720417611360093, -61.77407385967019, true, true, true),

  ('Fórum Sebastião Souza Moura – Santa Luzia do Oeste – RO', 'Santa Luzia',
   'Rua Dom Pedro I, esq. c/ Rua Tancredo Neves - Santa Luzia do Oeste – RO – CEP 76950-000',
   '(69) 3309-8561', 'Samuel Batista de Oliveria', '',
   -11.908085333512323, -61.78062473268278, true, true, true),

  ('Fórum de São Francisco do Guaporé – São Francisco do Guaporé – RO', 'São Francisco',
   'Avenida São Paulo, esq. c/ Rua Ronaldo Aragão – Centro - São Francisco do Guaporé – RO - CEP 76935-000',
   '(69) 3309-8845', 'Silvio Farias Souza', '',
   -12.062844501162404, -63.57539181733802, true, true, true),

  ('Fórum Anízio Garcia Martins – São Miguel do Guaporé – RO', 'São Miguel',
   'Avenida São Paulo n. 1395 – Bairro Cristo Rei - São Miguel do Guaporé – RO – CEP 76932-000',
   '(69) 3309-8795', 'Gilvan Rubens Caetano de Assis', '',
   -11.689152193573383, -62.71610063083503, true, true, true),

  ('Fórum Desembargador Leal Fagundes – Novo Fórum de Vilhena – RO', 'Vilhena',
   'Avenida Luiz Mazziero n. 4432 – Jardim América - Vilhena – RO – CEP 76980-702',
   '(69) 3309-8000', 'Ester Oliveira de Araújo', '',
   -12.734960884167553, -60.13252351733011, true, true, true),

  ('Edifício Sede do PJRO – Porto Velho – RO', 'Porto Velho',
   'Rua José Camacho, 585 – Bairro Olaria - Porto Velho - Rondônia - CEP 76801-330',
   '(69) 3309-6237', 'Nilson Pinho', 'Lucas Muniz Ferreira',
   -8.75262142469159, -63.9106315581591, true, true, true),

  ('Centro de Apoio Logístico – Porto Velho - RO', 'Porto Velho',
   'Rua da Beira, 6811, BR-364, Km 03 (três), sentido Cuiabá, ao lado do Atacadista Assaí - Lagoa - Porto Velho - Rondônia - CEP 76812-003',
   '(69) 3309-6260', 'Roni Ayres Vitorino', 'Evaldo Campos Cruz',
   -8.778923452654766, -63.867136857362, false, true, true),

  ('Centro Cultural e Documentação Histórica – Porto Velho – RO', 'Porto Velho',
   'Av. Rogerio Weber, 2396 - Caiari, Porto Velho - RO, 76801-160',
   '(69) 3309-6482', 'Alexandro Vieira Goncalves', 'Maria Emidia Vitalino',
   -8.76250032270941, -63.90687856155149, true, true, true),

  ('EMERON – Escola de Magistratura de Rondônia – Porto Velho – RO', 'Porto Velho',
   'Rua Rogério Weber, 1872 - Bairro Centro - Porto Velho - Rondônia - CEP 76801-906',
   '(69) 3309-6440', 'Rosy Miriam Silva Werklaenhg', 'Raimundo Nonato Miguel',
   -8.766911660615483, -63.905872407551655, true, true, true),

  ('Fórum Geral Desembargador César Montenegro – Porto Velho – RO', 'Porto Velho',
   'AV. Pinheiro Machado, 777 - Bairro Olaria - Porto Velho – CEP 76801-235',
   '(69) 3309-6260', 'Nilce Carlos e Gualter Keiber', 'Claudionor Ribeiro Chaves',
   -8.759310276704515, -63.90478393638793, true, true, true),

  ('Secretaria de Gestão de Pessoas – Porto Velho – RO', 'Porto Velho',
   'Av. Lauro Sodré, 1728 - Olaria, Porto Velho - RO, 76803-686',
   '(69) 3309-6437', 'Wilson Gomes de Souza', '',
   -8.749502089686533, -63.90388289263918, true, true, true),

  ('Anexo Administrativo – Porto Velho – RO', 'Porto Velho',
   'Av. Lauro Sodré, 2860 - Olaria, Porto Velho - RO, 78903-711',
   '(69) 3309-6221', 'Maria Conceição dos Santos', '',
   -8.739067328539482, -63.9017300253433, false, false, true),

  ('Antigo Centro Cultural e Documentação Histórica – Porto Velho – RO', 'Porto Velho',
   'Av. Brasilia, 2458, São Cristovão, Porto Velho - RO - CEP 76804-088',
   '(69) 3309-6600', 'Lucas Muniz', '',
   -8.75963980314924, -63.896635604439034, false, false, true),

  ('Fórum Digital – Candeias do Jamari – RO', 'Candeias',
   'Av. Transcontinental com Av. Tancredo Neves, Quadra 14, Setor 04, 76860-000',
   '(69) 3309-8850', 'Edneia Uete', '',
   -8.794833624146772, -63.70244273086512, false, false, false),

  ('Fórum Digital – Itapuã do Oeste – RO', 'Porto Velho',
   'Rua Presidente Médici, Setor 01, Quadra 34, Lote 206, 76861-000',
   '(69) 3309-7680', 'Maria Socorro Silva Fonseca', '',
   -9.184400255012315, -63.19229834896539, false, false, false),

  ('Fórum Digital – Cujubim – RO', 'Cujubim',
   'Av. Cujubim com Avenida Garça, Lote 01/A, Quadra 04, Setor 02, 76864-000',
   '(69) 3309-8870', 'Amabili Pereira', '',
   -9.363599307772185, -62.585814555397114, false, false, false),

  ('Fórum Digital – Alto Paraíso – RO', 'Alto Paraíso',
   'Avenida João Paulo II, Setor 1, Quadra 28',
   '(69) 3309-7690', 'Valdeni da Silva Santos', '',
   -9.727885272148068, -63.31703627257214, false, false, false),

  ('Fórum Digital – Extrema – RO', 'Porto Velho',
   'Av. Castelo Branco, 048, Centro',
   '(69) 3309-7660', 'Taís Breitenbach', '',
   -9.7714339521842, -66.35757671367645, false, false, false),

  ('Fórum Digital – Mirante da Serra – RO', 'Mirante da Serra',
   'Avenida Principal, 2449, 76926-000',
   '(69) 3309-7700', 'Márcio José Assunção Júnior', '',
   -11.030451707652213, -62.67302970141896, false, false, false),

  ('Fórum Digital – Campo Novo de Rondônia – RO', 'Campo Novo',
   'Av. Tancredo Neves esq. Av. Primeiro de Maio, Lote 0160, Quadra n. 0001, Setor 04',
   '(69) 3309-8880', 'Eliane Souza', '',
   -10.569964707154021, -63.61864850201116, false, false, false),

  ('Fórum Digital – Monte Negro – RO', 'Monte Negro',
   'R. Castelo Branco / R. Francisco Prestes, Lotes 14, 15, 16 e 17, Quadra n. 6A, Setor 02, CEP 76888-000',
   '(69) 3309-8890', 'Thalles Nascimento Bezerra', '',
   -10.260022343503922, -63.29919713085062, false, false, false),

  ('Fórum Digital – Chupinguaia – RO', 'Chupinguaia',
   'R. Senador Ronaldo Aragão, entre as Ruas Ulisses Guimarães e Av. 27. Lote 01, Quadra 06, Setor 10. CEP 76990-000',
   '(69) 3309-7685', 'Moisés Cazuza', '',
   -12.550932793899467, -60.89664561733214, false, false, false)
)
INSERT INTO public.unidades (
  nome, comarca_id, endereco, telefone, responsavel_local, responsavel_substituto,
  lat, lng, possui_derso, controle_acesso, vigilancia_eletronica
)
SELECT
  s.nome, c.id, s.endereco, s.telefone, s.responsavel_local, s.responsavel_substituto,
  s.lat, s.lng, s.possui_derso, s.controle_acesso, s.vigilancia_eletronica
FROM seed s
JOIN public.comarcas c ON c.nome = s.comarca_nome
WHERE NOT EXISTS (
  SELECT 1 FROM public.unidades u WHERE u.nome = s.nome
);

COMMIT;
