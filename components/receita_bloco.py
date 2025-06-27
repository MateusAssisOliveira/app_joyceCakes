# components/receita_bloco.py
import flet as ft
from logs.logger import Logger
from decimal import Decimal

class ReceitaBloco:
    """Componente responsável por criar e gerenciar os blocos visuais de receitas"""

    def __init__(self):
        self.log = Logger()
        self.log.info("Componente ReceitaBloco inicializado")

    def criar_bloco(self, receita: dict) -> ft.Container:
        """Cria um bloco visual completo para uma receita"""
        try:
            self.log.debug(f"Criando bloco para receita: {receita.get('nome_receita', 'Desconhecida')}")
            return ft.Container(
                content=self._criar_conteudo_bloco(receita),
                padding=15,
                border=ft.border.all(1, ft.Colors.GREY_300),
                border_radius=10,
                bgcolor=ft.Colors.GREY_50,
                width=400,
                on_click=self._handle_clique_bloco
            )
        except Exception as e:
            self.log.error(f"Erro ao criar bloco: {str(e)}")
            return ft.Container(content=ft.Text("Erro ao exibir receita"))

    def _criar_conteudo_bloco(self, receita: dict) -> ft.Column:
        """Cria a estrutura interna do bloco"""
        return ft.Column([
            self._criar_cabecalho(receita),
            self._criar_detalhes(receita),
            ft.Divider(),
            self._criar_modo_preparo(receita),
            self._criar_observacoes(receita),
            ft.Divider(),
            self._criar_chips_ingredientes(receita.get('nome_produto'))
        ], spacing=8)

    def _criar_cabecalho(self, receita: dict) -> ft.Text:
        """Cabeçalho com nome da receita"""
        return ft.Text(
            receita.get('nome_receita', 'Receita sem nome'),
            size=18,
            weight=ft.FontWeight.BOLD
        )

    def _criar_detalhes(self, receita: dict) -> ft.Column:
        """Seção com tempo, rendimento, descrição, preço, quantidade"""
        def tratar_decimal(valor):
            return float(valor) if isinstance(valor, Decimal) else valor

        tempo = receita.get('tempo_preparo_receita')
        tempo = f"{int(tempo)} min" if tempo else "Não informado"

        rendimento = tratar_decimal(receita.get('rendimento_receita'))
        rendimento = f"{rendimento} porções" if rendimento else "Não informado"

        quantidade = tratar_decimal(receita.get('quantidade'))
        quantidade = f"{quantidade}" if quantidade else "Não informado"

        preco = tratar_decimal(receita.get('preco_total'))
        preco = f"R$ {preco:.2f}" if preco is not None else "Não informado"

        descricao = receita.get('descricao_receita') or "Sem descrição"

        return ft.Column([
            ft.Text(f"⏱️ Tempo de preparo: {tempo}"),
            ft.Text(f"🍽️ Rendimento: {rendimento}"),
            ft.Text(f"🔢 Quantidade: {quantidade}"),
            ft.Text(f"💰 Preço total: {preco}"),
            ft.Text(f"📝 Descrição: {descricao}", size=14)
        ], spacing=4)

    def _criar_modo_preparo(self, receita: dict) -> ft.Text:
        """Modo de preparo da receita"""
        modo_preparo = receita.get('modo_preparo_preparo_receita', 'Não especificado')
        return ft.Text(f"📖 Modo de Preparo: {modo_preparo}", size=13)

    def _criar_observacoes(self, receita: dict) -> ft.Text:
        """Observações da receita"""
        observacoes = receita.get('observacoes', 'Sem observações')
        return ft.Text(f"📌 Observações: {observacoes}", size=12, italic=True)

    def _criar_chips_ingredientes(self, ingredientes_raw) -> ft.Row:
        """Cria chips a partir de string separada por vírgulas"""
        ingredientes = []
        if isinstance(ingredientes_raw, str):
            ingredientes = [i.strip() for i in ingredientes_raw.split(",") if i.strip()]
        elif isinstance(ingredientes_raw, list):
            ingredientes = ingredientes_raw

        self.log.debug(f"Ingredientes para chips: {ingredientes}")

        return ft.Row(
            controls=[self._criar_chip(i) for i in ingredientes],
            wrap=True,
            spacing=5,
            run_spacing=5
        )

    def _criar_chip(self, ingrediente: str) -> ft.Chip:
        """Cria chip individual"""
        return ft.Chip(
            label=ft.Text(ingrediente),
            #checkmark=True,
            selected_color=ft.Colors.GREEN_100
        )

    def _handle_clique_bloco(self, e):
        """Clique no bloco"""
        self.log.info("Bloco de receita clicado")
        pass
