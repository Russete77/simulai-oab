#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests
import pandas as pd
import json
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

print("Baixando dataset via Parquet do Hugging Face...\n")

# URL do arquivo parquet
parquet_url = "https://huggingface.co/datasets/russ7/oab_exams_2011_2025_combined/resolve/main/data/train-00000-of-00001.parquet"

# Token do Hugging Face (configure via variável de ambiente)
HF_TOKEN = os.environ.get("HUGGING_FACE_TOKEN", "")
headers = {
    "Authorization": f"Bearer {HF_TOKEN}"
}

print(f"Baixando de: {parquet_url}")
response = requests.get(parquet_url, headers=headers)

if response.status_code == 200:
    # Salvar parquet
    with open("dataset.parquet", "wb") as f:
        f.write(response.content)

    print("Arquivo parquet baixado com sucesso!\n")

    # Ler parquet
    df = pd.read_parquet("dataset.parquet")

    print(f"Total de linhas no parquet: {len(df)}\n")

    # Verificar duplicatas
    df_check = df[['exam_id', 'question_number']]
    duplicates = df_check.duplicated().sum()

    print(f"Duplicatas (exam_id + question_number): {duplicates}")
    print(f"Linhas unicas: {len(df) - duplicates}\n")

    # Converter para JSON
    data = df.to_dict('records')

    with open('dataset_from_parquet.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("Dataset salvo em dataset_from_parquet.json")

else:
    print(f"Erro ao baixar: {response.status_code}")
    print(response.text)
