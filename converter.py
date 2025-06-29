import csv
import json

def csv_para_json(caminho_csv, caminho_json):
    """
    Converte um arquivo CSV para um arquivo JSON.

    Args:
        caminho_csv (str): O caminho para o arquivo CSV de entrada.
        caminho_json (str): O caminho onde o arquivo JSON de saída será salvo.
    """
    dados = []

    try:
        # Abre o arquivo CSV para leitura
        with open(caminho_csv, mode='r', encoding='utf-8') as arquivo_csv:
            leitor_csv = csv.DictReader(arquivo_csv)
            for linha in leitor_csv:
                dados.append(linha)

        # Abre o arquivo JSON para escrita
        with open(caminho_json, mode='w', encoding='utf-8') as arquivo_json:
            json.dump(dados, arquivo_json, indent=4, ensure_ascii=False)
        
        print(f"Conversão concluída com sucesso! O arquivo '{caminho_json}' foi criado.")

    except FileNotFoundError:
        print(f"Erro: O arquivo de entrada '{caminho_csv}' não foi encontrado.")
    except Exception as e:
        print(f"Ocorreu um erro inesperado: {e}")

# --- Início da Execução do Script ---
if __name__ == "__main__":
    arquivo_csv_entrada = 'produtos.csv'
    arquivo_json_saida = 'produtos.json'

    csv_para_json(arquivo_csv_entrada, arquivo_json_saida)