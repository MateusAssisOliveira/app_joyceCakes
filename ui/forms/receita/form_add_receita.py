from typing import Any, Dict, List
from datetime import datetime
import flet as ft
from logs.logger import Logger  # Supondo que seu logger customizado esteja aqui

class ReceitaForm:
    def __init__(self, logger: Logger = None):
        self.log = logger or Logger()
        self._setup_campos_receita()

    def _setup_campos_receita(self):
        self.log.debug("Inicializando campos do formulário de receita")
        self.campo_id = ft.TextField(label="ID", disabled=True, visible=False)
        self.campo_nome = ft.TextField(label="Nome da Receita*", capitalization=ft.TextCapitalization.WORDS, hint_text="Ex: Bolo de Chocolate")
        self.campo_categoria = ft.Dropdown(label="Categoria*", options=[
            ft.dropdown.Option("bolos", "Bolos"),
            ft.dropdown.Option("sobremesas", "Sobremesas"),
            ft.dropdown.Option("paes", "Pães e Massas"),
        ], hint_text="Selecione uma categoria")

        self.campo_modo_preparo = ft.TextField(label="Modo de Preparo*", multiline=True, min_lines=4, max_lines=8)
        self.descricao = ft.TextField(label="Descrição", multiline=True, min_lines=4, max_lines=8)
        self.campo_tempo = ft.TextField(label="Tempo (minutos)*", keyboard_type=ft.KeyboardType.NUMBER, width=120)
        self.campo_rendimento = ft.TextField(label="Rendimento*", width=120, suffix_text="porções")

        self.campo_dificuldade = ft.Dropdown(label="Dificuldade*", options=[
            ft.dropdown.Option("fácil", "Fácil"),
            ft.dropdown.Option("médio", "Médio"),
            ft.dropdown.Option("difícil", "Difícil"),
        ], value="fácil")

        self.campo_calorias = ft.TextField(label="Calorias por Porção", keyboard_type=ft.KeyboardType.NUMBER, width=180)

        self.campo_unidade_medida = ft.Dropdown(label="Unidade de Medida*", options=[
            ft.dropdown.Option("1", "Porção"),
            ft.dropdown.Option("2", "Fatia"),
            ft.dropdown.Option("3", "Unidade"),
        ], hint_text="Selecione a unidade", width=180)

    def get_campos(self) -> List[ft.Control]:
        return [
            self.campo_id,
            self.campo_nome,
            ft.Row([self.campo_categoria, self.campo_dificuldade]),
            ft.Row([self.campo_tempo, self.campo_rendimento]),
            ft.Row([self.campo_unidade_medida, self.campo_calorias]),
            self.campo_modo_preparo,
            ft.Divider(),
            self.descricao
        ]

    def get_valores(self) -> Dict[str, Any]:
        valores = {}
        try:
            valores["nome"] = self.campo_nome.value.strip()
            valores["descricao"] = self.descricao.value.strip()
            valores["modo_preparo"] = self.campo_modo_preparo.value.strip()

            valores["tempo_preparo"] = int(self.campo_tempo.value) if self.campo_tempo.value else 0
            valores["rendimento"] = float(self.campo_rendimento.value) if self.campo_rendimento.value else 0.0
            valores["unidade_medida_id"] = int(self.campo_unidade_medida.value) if self.campo_unidade_medida.value else 1

            valores["dificuldade"] = self.campo_dificuldade.value
            valores["categoria_id"] = self._mapear_categoria_para_id(self.campo_categoria.value)

            valores["calorias_por_porcao"] = int(self.campo_calorias.value) if self.campo_calorias.value else 0

            valores["ingredientes"] = []  # Preenchido externamente
            valores["data_cadastro"] = datetime.now()

            self.log.debug(f"\nValores coletados do formulário: {valores}")

        except ValueError as ve:
            self.log.error(f"Erro na conversão de campo numérico: {ve}")
            raise ValueError(f"Erro na conversão de campo numérico: {ve}") from ve

        except Exception as e:
            self.log.error(f"Erro inesperado ao obter valores do formulário: {e}")
            raise

        return valores

    def preencher_campos(self, receita: Dict[str, Any]):
        try:
            self.log.info(f"Preenchendo formulário com dados da receita ID {receita.get('id')}")
            self.campo_id.value = str(receita.get("id", ""))
            self.campo_id.visible = True
            self.campo_nome.value = receita.get("nome", "")
            self.campo_categoria.value = self._mapear_categoria_para_nome(receita.get("categoria_id"))
            self.campo_modo_preparo.value = receita.get("modo_preparo", "")
            self.descricao.value = receita.get("descricao", "")
            self.campo_tempo.value = str(receita.get("tempo_preparo", ""))
            self.campo_rendimento.value = str(receita.get("rendimento", ""))
            self.campo_dificuldade.value = receita.get("dificuldade", "fácil")
            self.campo_unidade_medida.value = str(receita.get("unidade_medida_id", "1"))
            self.campo_calorias.value = str(receita.get("calorias_por_porcao", ""))
        except Exception as e:
            self.log.error(f"Erro ao preencher campos do formulário: {e}")
            raise

    def limpar_campos(self):
        self.log.debug("Limpando todos os campos do formulário de receita")
        self.campo_id.value = ""
        self.campo_id.visible = False
        self.campo_nome.value = ""
        self.campo_categoria.value = ""
        self.campo_modo_preparo.value = ""
        self.descricao.value = ""
        self.campo_tempo.value = ""
        self.campo_rendimento.value = ""
        self.campo_dificuldade.value = "fácil"
        self.campo_unidade_medida.value = ""
        self.campo_calorias.value = ""

    def _mapear_categoria_para_id(self, nome_categoria: str) -> int:
        categorias = {
            "bolos": 1,
            "sobremesas": 2,
            "paes": 3
        }
        categoria_id = categorias.get(nome_categoria, 0)
        self.log.debug(f"\nConvertendo categoria '{nome_categoria}' para ID: {categoria_id}")
        return categoria_id

    def _mapear_categoria_para_nome(self, categoria_id: int) -> str:
        ids = {
            1: "bolos",
            2: "sobremesas",
            3: "paes"
        }
        nome = ids.get(categoria_id, "")
        self.log.debug(f"\nConvertendo ID de categoria '{categoria_id}' para nome: '{nome}'")
        return nome
