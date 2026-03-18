#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import sys
from collections import defaultdict

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

print("Analise profunda do dataset...\n")

with open('dataset_complete.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total de questoes: {len(data)}\n")

# Vamos ver alguns IDs específicos para entender a estrutura
print("Primeiras 10 questoes (ID completo):")
for i in range(10):
    q = data[i]
    print(f"{i}: ID='{q['id']}' | exam_id='{q['exam_id']}' | question_number={q['question_number']} | type='{q['question_type']}'")

print("\n\nQuestoes no meio (posicao 2200-2220):")
for i in range(2200, 2220):
    if i < len(data):
        q = data[i]
        print(f"{i}: ID='{q['id']}' | exam_id='{q['exam_id']}' | question_number={q['question_number']} | type='{q['question_type']}'")

print("\n\nUltimas 10 questoes:")
for i in range(len(data)-10, len(data)):
    q = data[i]
    print(f"{i}: ID='{q['id']}' | exam_id='{q['exam_id']}' | question_number={q['question_number']} | type='{q['question_type']}'")

# Verificar IDs únicos vs chave composta
ids_unicos = set(q['id'] for q in data)
chaves_compostas = set(f"{q['exam_id']}_{q['question_number']}" for q in data)

print(f"\n\nEstatisticas:")
print(f"Total de registros: {len(data)}")
print(f"IDs unicos (campo 'id'): {len(ids_unicos)}")
print(f"Chaves compostas unicas (exam_id + question_number): {len(chaves_compostas)}")

# Se tem diferença, vamos ver quais IDs se repetem
if len(ids_unicos) != len(data):
    print(f"\nAlguns IDs aparecem mais de uma vez!")
    id_counts = defaultdict(int)
    for q in data:
        id_counts[q['id']] += 1

    repeated = {k: v for k, v in id_counts.items() if v > 1}
    print(f"IDs repetidos: {len(repeated)}")
    print("Primeiros 5 IDs repetidos:")
    for i, (id_val, count) in enumerate(list(repeated.items())[:5]):
        print(f"  {id_val}: aparece {count} vezes")

# Verificar se questões com mesmo exam_id+question_number tem conteúdo diferente
print("\n\nVerificando questoes com mesma chave mas possivelmente conteudo diferente:")
grouped_by_key = defaultdict(list)
for i, q in enumerate(data):
    key = f"{q['exam_id']}_{q['question_number']}"
    grouped_by_key[key].append((i, q))

diferentes = 0
for key, questions in grouped_by_key.items():
    if len(questions) > 1:
        # Comparar o texto da primeira com as outras
        first_text = questions[0][1]['question']
        for idx, q in questions[1:]:
            if q['question'] != first_text:
                diferentes += 1
                if diferentes <= 3:
                    print(f"\n{key} - QUESTOES DIFERENTES:")
                    print(f"  Posicao {questions[0][0]}: {questions[0][1]['question'][:100]}...")
                    print(f"  Posicao {idx}: {q['question'][:100]}...")
                break

if diferentes == 0:
    print("TODAS as questoes com mesma chave tem CONTEUDO IDENTICO")
else:
    print(f"\nTotal de chaves com conteudo diferente: {diferentes}")
