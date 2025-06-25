# components/receita_bloco.py
import flet as ft
from logs.logger import Logger

class ReceitaBloco:
    """Componente responsável por criar e gerenciar os blocos visuais de receitas"""
    
    def __init__(self):
        self.log = Logger()
        self.log.info("Componente ReceitaBloco inicializado")
    
    def criar_bloco(self, receita: dict) -> ft.Container:
        """Cria um bloco visual completo para uma receita"""
        try:
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
            return ft.Container(content=ft.Text(f"Erro ao exibir receita"))

    def _criar_conteudo_bloco(self, receita: dict) -> ft.Column:
        """Cria a estrutura interna do bloco"""
        return ft.Column([
            self._criar_cabecalho(receita),
            self._criar_detalhes(receita),
            ft.Divider(),
            self._criar_chips_ingredientes(receita.get('ingredientes', []))
        ], spacing=8)

    def _criar_cabecalho(self, receita: dict) -> ft.Text:
        """Cria o cabeçalho do bloco com o nome da receita"""
        return ft.Text(
            receita['nome'], 
            size=18, 
            weight=ft.FontWeight.BOLD
        )

    def _criar_detalhes(self, receita: dict) -> ft.Column:
        """Cria a seção de detalhes da receita"""
        return ft.Column([
            ft.Text(f"⏱️ Tempo: {receita.get('tempo_preparo', 'N/A')}"),
            ft.Text(f"🍽️ Rendimento: {receita.get('rendimento', 'N/A')}"),
            ft.Text(f"📝 Descrição: {receita.get('descricao', '')}", size=14)
        ], spacing=4)

    def _criar_chips_ingredientes(self, ingredientes: list) -> ft.Row:
        """Cria os chips de ingredientes"""
        return ft.Row(
            controls=[self._criar_chip(i) for i in ingredientes],
            wrap=True,
            spacing=5,
            run_spacing=5
        )

    def _criar_chip(self, ingrediente: str) -> ft.Chip:
        """Cria um chip individual para ingrediente"""
        return ft.Chip(
            label=ft.Text(ingrediente),
            checkmark=True,
            selected_color=ft.Colors.GREEN_100
        )

    def _handle_clique_bloco(self, e):
        """Handler para clique no bloco"""
        # Pode ser sobrescrito ou configurado externamente
        pass