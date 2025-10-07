#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para baixar o dataset completo do Hugging Face e exportar para JSON
"""
from datasets import load_dataset
import json
import sys

# Fix encoding for Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

print("Baixando dataset completo do Hugging Face...")
print("Dataset: russ7/oab_exams_2011_2025_combined\n")

# Token do Hugging Face (configure via variável de ambiente)
HF_TOKEN = os.environ.get("HUGGING_FACE_TOKEN", "")

# Baixar dataset completo com token
dataset = load_dataset(
    "russ7/oab_exams_2011_2025_combined",
    split="train",
    token=HF_TOKEN
)

print(f"Dataset carregado: {len(dataset)} questoes\n")

# Converter para lista de dicionários
data = []
for item in dataset:
    data.append({
        "id": item["id"],
        "question_number": item["question_number"],
        "exam_id": item["exam_id"],
        "exam_year": item["exam_year"],
        "question_type": item["question_type"],
        "nullified": item["nullified"],
        "question": item["question"],
        "choices": item["choices"],
        "answerKey": item["answerKey"]
    })

# Salvar em JSON
output_file = "dataset_complete.json"
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Dataset exportado para {output_file}")
print(f"Total de questoes: {len(data)}")

# Estatísticas
question_types = {}
for item in data:
    qt = item["question_type"]
    question_types[qt] = question_types.get(qt, 0) + 1

print(f"\nTipos de questoes encontrados:")
for qt, count in sorted(question_types.items(), key=lambda x: x[1], reverse=True):
    print(f"   {qt}: {count}")
