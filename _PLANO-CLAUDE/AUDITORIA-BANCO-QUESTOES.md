# Auditoria do banco de questões — 05/09/2026

Levantada porque a pergunta certa foi feita: *"você revisou todas as questões
por completo?"* Não tinha revisado. Fui olhar e achei o que está abaixo.

Tudo aqui é medido, não estimado. Os números saem de consulta ao banco de
produção.

---

## Resumo

Medido por `npx tsx scripts/auditar-questoes.ts`, sobre **5.857 questões
válidas**. As 18 anuladas pela FGV ficam de fora: anulada não tem
alternativa nem gabarito, e isso é o correto.

| achado | tamanho | gravidade |
|---|---|---|
| Questões duplicadas | 2.250 (38,4%) | alta |
| Citações "Art. 5º da CF" — o curinga | 447 | alta — **mitigado** |
| Artigo citado que não existe no código | 10 | alta — **mitigado** |
| `examPhase` com valor inválido | 2.308 | média |
| `questionNumber` acima de 80 | 2.259 | média — consequência da duplicação |
| Alternativa repetida na mesma questão | 10 | média |
| Explicação divergente do gabarito | 1 | média |
| `successRate` nunca populado | 5.857 | baixa |

**A estrutura está limpa.** Zero questão sem gabarito, zero com gabarito
duplo, zero fora do padrão A–D, zero enunciado truncado. O que existe de
errado é duplicação e metadado, não questão quebrada.

---

## 1 · Duplicação — 2.250 questões

### O que é

O mesmo enunciado aparece duas vezes **dentro do mesmo exame**, com números
de questão diferentes:

```
2010-01   questão  30  e  questão 130
2012-07   questão  50  e  questão 130
2011-03   questão  28  e  questão 127
2017-23   questão   6  e  questão  86
```

- **2.229 grupos** de enunciado repetido
- **2.227 grupos estão no mesmo exame** — só 2 cruzam exames diferentes
- Sobra de **2.250 cópias excedentes** → restam **3.607 questões únicas**

O padrão de deslocamento (+80, +100) e o fato de estar sempre no mesmo exame
apontam para a mesma prova importada duas vezes — provavelmente Tipo 1 e
Tipo 2, que só embaralham a ordem das questões.

Isso também explica `questionNumber` chegando a 200 e `examPhase` com valores
como 14, 20 e 25 (fase de exame só existe 1 e 2).

### Por que dá para mesclar com segurança

Três verificações, todas passaram:

| verificação | resultado |
|---|---|
| As cópias têm o mesmo gabarito? | **2.229 de 2.229 sim.** Zero divergência |
| As alternativas são idênticas (rótulo, texto, correta)? | **2.228 de 2.229 sim.** 1 difere |
| Todas as cópias têm explicação? | **2.229 de 2.229 sim** |

Gabarito e alternativas idênticos são o que torna a fusão possível: uma
resposta de usuário pode ser reapontada da cópia removida para a
sobrevivente **casando pelo rótulo** da alternativa.

### O que está em risco

```
cópias a remover ................... 2.250
respostas de usuário nelas ......... 1.458   (10,3% das 14.221 do banco)
grupos com as DUAS cópias em uso ..... 508
```

**As 1.458 respostas não podem ser apagadas.** `UserAnswer` tem
`onDelete: Cascade` tanto para `Question` quanto para `Alternative` — apagar
a questão duplicada leva as respostas junto, em silêncio. Elas alimentam o
ranking, o histórico e o desempenho por matéria.

### O procedimento

Nesta ordem. Cada passo é verificável antes do seguinte.

**Passo 0 — backup.** Dump das tabelas `Question`, `Alternative`,
`UserAnswer` e `QuestionExplanation` antes de qualquer escrita. Sem isso não
se começa.

**Passo 1 — eleger a sobrevivente.** Por grupo, fica a de **menor
`questionNumber`**: é a numeração real da prova. As outras são cópias.

**Passo 2 — mapear alternativas.** Para cada cópia removida, montar
`alternativa_da_cópia → alternativa_da_sobrevivente` casando pelo `label`.
Abortar o grupo se algum rótulo não casar.

**Passo 3 — migrar as respostas.** `UPDATE "UserAnswer"` trocando
`questionId` e `alternativeId` pelos da sobrevivente. **Antes de apagar
qualquer coisa.**

**Passo 4 — conferir.** O total de `UserAnswer` tem que ser exatamente o
mesmo de antes: 14.221. Se mudou, parar e reverter.

**Passo 5 — remover as cópias.** Só depois do passo 4 fechar.

**Passo 6 — redirecionar as URLs.** Ver abaixo. É o passo que mais se
esquece.

### Passo 6, em destaque: 2.250 URLs vão morrer

Cada uma das 2.250 questões removidas tem URL pública `/questoes/[id]`, presente no
sitemap e possivelmente já indexada. Apagar sem mais nada cria **2.250 novos
404** — e o Search Console já acusa 96 "Não encontrado".

Cada cópia removida precisa de **301 permanente** para a sobrevivente. Isso
preserva o pouco de autoridade que essas páginas juntaram e evita que o
Google veja o site perdendo 2.250 páginas de uma vez.

Implementação: uma tabela `QuestionRedirect (deId, paraId)` preenchida no
passo 5, consultada em `app/questoes/[id]/page.tsx` antes do `notFound()`.

### O caso manual

**1 grupo** tem alternativas que diferem entre as cópias. Precisa de olho
humano antes de decidir qual vale.

---

## 2 · O número "5.875" está errado

Sem as duplicatas, o banco tem **3.607 questões únicas**.

"5.875 questões oficiais" aparece hoje no título da home, na meta description,
no FAQ com dado estruturado, na landing de simulado e nos textos de venda.
É **63% acima do real**.

Num nicho onde o comprador é estudante de Direito e confere tudo, isso é
material para um post viral contra você. E como está em `FAQPage` schema,
o Google também lê.

Corrigir isso é independente da deduplicação e pode ir hoje: basta contar
enunciados distintos em vez de linhas.

---

## 3 · Citações de lei — mitigado

As 5.857 explicações foram geradas por `gpt-4o-mini`. O padrão é o clássico:
o modelo **raciocina bem sobre o enunciado que tem na frente** e **inventa
número de artigo**.

- 3.014 citações distintas — a maioria parece específica e plausível
- **447 caem em "Art. 5º da CF"**, o artigo curinga de quando não se sabe
- Das 2 que conferi à mão, **as 2 estavam erradas**:
  - Estagiário de Direito → citou "Art. 5º, XXVIII, CF/88" (direito autoral).
    O correto é Estatuto da OAB, Lei 8.906/94, e o Regulamento Geral
  - Direitos do usuário de serviço público → citou "Art. 5º, CF/88".
    O correto é Lei 13.460/2017

**Já resolvido em 05/09:** a linha "Fundamento legal" saiu da página e saiu
também do dado estruturado — se ficasse lá, o Google leria a citação como
afirmação nossa sobre a lei, mesmo escondida na tela.

O resto da explicação continua no ar. Raciocínio impreciso o leitor perdoa;
citação falsa, não.

### Dez citações que são provavelmente impossíveis

A auditoria confere se o artigo citado **existe** naquele código. Dez não
existem:

```
2011-04 Q25   Art. 428, ECA              ECA vai até 267
2012-06 Q69   Art. 995, CPP              CPP vai até 811
2012-08 Q3    Art. 95, Lei 8.906/94      Estatuto da OAB vai até 87
2016-20 Q7    Art. 94, Lei 8.906/94      idem
2017-22 Q67   Art. 1.046, CPP            CPP vai até 811
2010-01 Q166  Art. 275, CTN              CTN vai até 218
2010-01 Q66   Art. 275, CTN              idem
2025-01 Q41   Art. 42, ECA               ECA vai até 267
2015-18 Q54   Art. 1.105 do CPC          ver ressalva
2017-22 Q78   Art. 1.102-B do CPC        ver ressalva
```

**Ressalva honesta:** as duas do CPC não são impossíveis, são *velhas*. O
CPC/1973 ia até o art. 1.220, e tanto o 1.105 quanto o 1.102-B existiam lá.
Citar o código revogado numa questão de 2015 e 2017 é defensável — a prova
era daquela época. As outras oito são fabricação.

Isso é a prova dura do que antes era só suspeita: o modelo inventa número de
artigo.

**Para trazer o fundamento de volta:** regerar só o campo `baseLegal` com
modelo maior e uma passada de verificação contra o texto da lei. É lote,
roda uma vez. E a checagem de faixa de artigo, que já existe no
`scripts/auditar-questoes.ts`, passa a ser o portão.

---

## 4 · A qualidade da explicação é boa

Vale registrar porque eu dei um alarme maior do que os dados sustentavam.

Das 3.903 explicações que afirmam qual alternativa é a correta:

```
concordam com o gabarito .... 3.902
divergem ....................      1
```

Chegar nesse 1 custou duas correções no detector, e as duas valem registro
porque são a mesma armadilha:

**Primeira passada, 2 divergências.** O detector só entendia "a alternativa X
está correta". Nas questões que pedem a ERRADA, a explicação diz "a
alternativa X está incorreta" — e acertar ali é o esperado.

**Segunda passada, 7 divergências.** Melhorei o detector, mas o
reconhecimento de "esta questão pede a errada" só conhecia a palavra
"alternativa". A FGV escreve "assinale a **afirmativa** INCORRETA", "assinale
a **opção** INCORRETA" e "à **exceção** de uma". Seis falsos positivos.

**Terceira passada, 1 divergência.** É a real, e está na seção 5.

Registro isso porque o padrão vai se repetir em qualquer verificação
automática sobre este banco: **o enunciado da FGV inverte a lógica com
frequência**, e detector ingênuo acusa erro onde há acerto.

---

## 5 · Um gabarito que parece errado

**2016-20, questão 144, Penal.**

Mário, 45 anos, e Joana, 14, mantiveram relações por dois meses, com
consentimento. O gabarito do banco marca **"é atípica, em razão do
consentimento da ofendida"**.

Isso é estupro de vulnerável — art. 217-A do CP, e a Súmula 593 do STJ é
expressa em dizer que o consentimento, a experiência sexual anterior e a
existência de relacionamento amoroso são irrelevantes. A alternativa B do
próprio banco diz exatamente "configura crime de estupro de vulnerável", e
está marcada como errada.

Não sei se é erro de importação ou fonte não oficial. **Não alterei nada** —
mudar gabarito por leitura minha, sem fonte, seria trocar um erro por outro.

Note também: **questão 144** num exame de 80 questões. É provável que esta
questão venha do lote duplicado, e que a deduplicação já a remova.

---

## 6 · Verificação de veracidade — o que dá e o que não dá

O pedido foi "revisar todas as questões por completo". Preciso ser exato
sobre o que isso significa na prática.

### Camada 1 — automática, posso fazer agora

- Deduplicação (este plano)
- Integridade estrutural: 1 correta por questão, rótulos A–D completos
- Explicação × gabarito, com detector corrigido
- Sanidade de citação: o artigo citado existe naquele código?
  (Art. 1.829 do CC existe; Art. 8.421 do CC não)
- `examPhase` e `questionNumber` fora de faixa

### Camada 2 — precisa de fonte externa, posso fazer

**Cruzar o gabarito com o PDF oficial da FGV.** Isto é verificação de
verdade, não de coerência. `_PLANO-CLAUDE/provas-fgv/BAIXAR-AQUI.md` já tem
os links oficiais dos exames 44, 45 e 46 — a pasta está vazia, os PDFs nunca
foram baixados.

Com eles dá para conferir 240 questões contra a fonte. Se bater 100%, a
confiança no resto sobe muito. Se não bater, achamos um problema sistêmico.

### Camada 3 — não consigo sozinho

- **Validar 3.014 citações** contra o texto da lei
- **Julgar a correção jurídica** de 3.607 questões

A saída realista para a camada 3 é regerar as citações com modelo maior e
uma passada de verificação, e aceitar revisão humana por amostragem. Não é
algo que eu resolva lendo tudo, e dizer que resolvo seria mentira.

---

## Ordem sugerida

1. **Corrigir o "5.875"** — hoje, independente de tudo, e para de anunciar número errado
2. **Baixar os 3 PDFs da FGV** e cruzar 240 gabaritos — mede a confiabilidade da fonte
3. **Deduplicar**, com backup e os 301 do passo 6
4. **Limpar `examPhase`**, que fica trivial depois da dedup
5. **Regerar as citações** e trazer o fundamento legal de volta
6. **Revisar a 2016-20 Q144** e o grupo de alternativas divergentes
