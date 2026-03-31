import * as fs from "fs";

const HUGGINGFACE_API_URL =
  "https://datasets-server.huggingface.co/rows?dataset=russ7/oab_exams_2011_2025_combined&config=default&split=train";

interface QuestionData {
  id: string;
  question_number: number;
  exam_id: string;
  exam_year: string;
  question_type: string;
  nullified: boolean;
  question: string;
  choices: {
    label: string[];
    text: string[];
  };
  answerKey: number;
}

async function fetchAllQuestions() {
  const allQuestions: QuestionData[] = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  console.log("📥 Buscando questões do Hugging Face via API...\n");

  while (hasMore) {
    const url = `${HUGGINGFACE_API_URL}&offset=${offset}&length=${limit}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        console.log(`⚠️  Erro ao buscar offset ${offset}: ${response.statusText}`);
        hasMore = false;
        break;
      }

      const data = await response.json();
      const rows = data.rows as { row: QuestionData }[];

      if (rows.length === 0) {
        hasMore = false;
        break;
      }

      allQuestions.push(...rows.map((r) => r.row));
      console.log(`  Buscadas: ${allQuestions.length} questões...`);

      offset += limit;

      // Aguardar um pouco para não sobrecarregar a API
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Erro no offset ${offset}:`, error);
      hasMore = false;
    }
  }

  console.log(`\n✅ Total obtido: ${allQuestions.length} questões\n`);
  return allQuestions;
}

async function main() {
  const questions = await fetchAllQuestions();

  // Verificar duplicatas
  const seen = new Set<string>();
  const unique: QuestionData[] = [];

  for (const q of questions) {
    const key = `${q.exam_id}_${q.question_number}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(q);
    }
  }

  console.log(`📊 Estatísticas:`);
  console.log(`  Total baixado: ${questions.length}`);
  console.log(`  Únicos: ${unique.length}`);
  console.log(`  Duplicados: ${questions.length - unique.length}\n`);

  // Salvar
  const outputFile = "dataset_from_api.json";
  fs.writeFileSync(outputFile, JSON.stringify(unique, null, 2), "utf-8");

  console.log(`✅ Dataset salvo em: ${outputFile}`);

  // Tipos de questão
  const types: Record<string, number> = {};
  for (const q of unique) {
    types[q.question_type] = (types[q.question_type] || 0) + 1;
  }

  console.log(`\n📚 Tipos de questão:`);
  Object.entries(types)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
}

main().catch(console.error);
